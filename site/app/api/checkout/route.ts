import { sameOrigin } from "../../../lib/auth/session";
import { createOrder, setOrderInvoice, CheckoutError, type ShippingMethod } from "../../../db/orders";
import { createInvoice, XenditError } from "../../../lib/xendit";
import { computeShippingFee, getInternationalShippingFee, type InternationalShippingMethod } from "../../../lib/shipping";
import { isValidEmail, isValidInternationalPostalCode, isValidPostalCode } from "../../../lib/validation";

export const dynamic = "force-dynamic";

const str = (value: unknown, max: number) =>
  typeof value === "string" && value.trim().length > 0 && value.trim().length <= max
    ? value.trim()
    : null;

export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "Permintaan tidak valid." }, { status: 403 });
  let body: {
    customer?: Record<string, unknown>;
    items?: { id: string; quantity: number; variantId?: number | null }[];
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Data tidak valid." }, { status: 400 });
  }

  const customer = body.customer ?? {};
  const name = str(customer.name, 80);
  const phone = str(customer.phone, 20);
  const email = str(customer.email, 120);
  const city = str(customer.city, 80);
  const address = str(customer.address, 400);
  const notes = typeof customer.notes === "string" ? customer.notes.trim().slice(0, 200) : "";
  const items = Array.isArray(body.items) ? body.items : [];

  // Negara kosong/"Indonesia" = alamat domestik (jalur lama: RajaOngkir/flat,
  // field administratif lengkap). Negara lain = alamat internasional (ongkir
  // flat manual dari admin, cuma 2 pilihan: Standard/Express).
  const country = typeof customer.country === "string" ? customer.country.trim().slice(0, 80) : "";
  const isInternational = country !== "" && country.toLowerCase() !== "indonesia";

  if (
    !name || !phone || !email || !city || !address || !isValidEmail(email) ||
    items.length === 0 || items.length > 20 ||
    items.some((item) => typeof item.id !== "string" || !Number.isInteger(item.quantity) ||
      (item.variantId !== undefined && item.variantId !== null && !Number.isInteger(item.variantId)))
  ) {
    return Response.json({ error: "Periksa kembali data alamat dan produk pesanan." }, { status: 400 });
  }

  let province: string | null;
  let intlPostal: string | null = null;
  let intlMethod: InternationalShippingMethod | null = null;
  let district: string | null = null;
  let village: string | null = null;
  let postal: string | null = null;
  let shippingCourier: string | undefined;
  let shippingService: string | undefined;

  if (isInternational) {
    // Provinsi/state opsional untuk alamat luar negeri — banyak negara tidak
    // punya sistem administratif setingkat provinsi, jadi tidak dipaksa isi.
    province = str(customer.province, 80);
    intlPostal = typeof customer.postal === "string" && isValidInternationalPostalCode(customer.postal.trim())
      ? customer.postal.trim()
      : null;
    intlMethod = customer.shippingMethod === "intl_express" ? "intl_express" : customer.shippingMethod === "intl_standard" ? "intl_standard" : null;
    if (!intlPostal || !intlMethod) {
      return Response.json({ error: "Periksa kembali data alamat dan pilihan pengiriman internasional." }, { status: 400 });
    }
  } else {
    province = str(customer.province, 80);
    district = str(customer.district, 80);
    village = str(customer.village, 80);
    postal = typeof customer.postal === "string" && isValidPostalCode(customer.postal) ? customer.postal : null;
    if (!province || !district || !village || !postal) {
      return Response.json({ error: "Periksa kembali data alamat dan produk pesanan." }, { status: 400 });
    }
    shippingCourier = typeof customer.shippingCourier === "string" ? customer.shippingCourier.slice(0, 32) : undefined;
    shippingService = typeof customer.shippingService === "string" ? customer.shippingService.slice(0, 32) : undefined;
  }

  try {
    let shippingFee: number;
    let shippingAddress: string;
    let shippingMethod: ShippingMethod;

    if (isInternational && intlMethod) {
      shippingMethod = intlMethod;
      shippingFee = await getInternationalShippingFee(intlMethod);
      shippingAddress = [address, city, province, intlPostal, country].filter(Boolean).join(", ");
    } else {
      shippingMethod = "domestic";
      shippingFee = await computeShippingFee({
        postal: postal!,
        items: items.map((item) => ({ productId: item.id, quantity: item.quantity, variantId: item.variantId ?? null })),
        preferredCourier: shippingCourier,
        preferredService: shippingService,
      });
      shippingAddress = `${address}, ${village}, ${district}, ${city}, ${province} ${postal}`;
    }

    const order = await createOrder({
      customerName: name,
      customerEmail: email,
      customerPhone: phone,
      shippingAddress,
      notes,
      items: items.map((item) => ({ productId: item.id, quantity: item.quantity, variantId: item.variantId ?? null })),
      shippingFee,
      shippingMethod,
    });

    const origin = new URL(request.url).origin;
    const invoice = await createInvoice({
      externalId: order.id,
      amount: order.total,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      items: [
        ...order.items.map((item) => ({
          name: item.variantLabel ? `${item.productName} (${item.variantLabel})` : item.productName,
          quantity: item.quantity,
          price: item.unitPrice,
        })),
        ...(order.shippingFee > 0 ? [{ name: "Ongkos kirim", quantity: 1, price: order.shippingFee }] : []),
      ],
      successUrl: `${origin}/?order=${order.id}&payment=success`,
      failureUrl: `${origin}/?order=${order.id}&payment=failed`,
    });
    await setOrderInvoice(order.id, invoice);

    return Response.json({ redirectUrl: invoice.invoiceUrl, orderId: order.id }, { status: 201 });
  } catch (error) {
    if (error instanceof CheckoutError) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof XenditError) {
      console.error(error);
      return Response.json({ error: "Pembayaran belum bisa diproses. Coba lagi nanti." }, { status: 503 });
    }
    console.error(error);
    return Response.json({ error: "Pesanan belum tersimpan. Coba lagi." }, { status: 503 });
  }
}
