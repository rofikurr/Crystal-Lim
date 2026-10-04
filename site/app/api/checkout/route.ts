import { sameOrigin } from "../../../lib/auth/session";
import { createOrder, setOrderInvoice, CheckoutError } from "../../../db/orders";
import { getSetting } from "../../../db/settings";
import { createInvoice, XenditError } from "../../../lib/xendit";

export const dynamic = "force-dynamic";

const str = (value: unknown, max: number) =>
  typeof value === "string" && value.trim().length > 0 && value.trim().length <= max
    ? value.trim()
    : null;

export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "Permintaan tidak valid." }, { status: 403 });
  let body: {
    customer?: Record<string, unknown>;
    items?: { id: string; quantity: number }[];
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
  const province = str(customer.province, 80);
  const city = str(customer.city, 80);
  const district = str(customer.district, 80);
  const village = str(customer.village, 80);
  const address = str(customer.address, 400);
  const postal = typeof customer.postal === "string" && /^[0-9]{5}$/.test(customer.postal) ? customer.postal : null;
  const notes = typeof customer.notes === "string" ? customer.notes.trim().slice(0, 200) : "";
  const items = Array.isArray(body.items) ? body.items : [];

  if (
    !name || !phone || !email || !province || !city || !district || !village || !address || !postal ||
    !/^\S+@\S+\.\S+$/.test(email) ||
    items.length === 0 || items.length > 20 ||
    items.some((item) => typeof item.id !== "string" || !Number.isInteger(item.quantity))
  ) {
    return Response.json({ error: "Periksa kembali data alamat dan produk pesanan." }, { status: 400 });
  }

  try {
    const shippingFee = Number(await getSetting("shipping_flat_fee", "0"));
    const shippingAddress = `${address}, ${village}, ${district}, ${city}, ${province} ${postal}`;
    const order = await createOrder({
      customerName: name,
      customerEmail: email,
      customerPhone: phone,
      shippingAddress,
      notes,
      items: items.map((item) => ({ productId: item.id, quantity: item.quantity })),
      shippingFee,
    });

    const origin = new URL(request.url).origin;
    const invoice = await createInvoice({
      externalId: order.id,
      amount: order.total,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      items: [
        ...order.items.map((item) => ({ name: item.productName, quantity: item.quantity, price: item.unitPrice })),
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
