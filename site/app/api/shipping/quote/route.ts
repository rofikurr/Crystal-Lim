import { sameOrigin } from "../../../../lib/auth/session";
import { getClientIp, isRateLimited, rateLimitResponse } from "../../../../lib/rate-limit";
import { getShippingOptions } from "../../../../lib/shipping";
import { isValidPostalCode } from "../../../../lib/validation";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "Permintaan tidak valid." }, { status: 403 });
  // Tiap klik tombol "Cek Ongkos Kirim" makan kuota RajaOngkir (akun Starter:
  // 100 hit/hari) — batasi lebih ketat dari endpoint lain supaya tidak jebol.
  if (isRateLimited(`shipping-quote:${getClientIp(request)}`, 20, 60 * 60 * 1000)) {
    return rateLimitResponse();
  }

  let body: { postal?: string; items?: { id: string; quantity: number }[] };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Data tidak valid." }, { status: 400 });
  }

  const postal = typeof body.postal === "string" && isValidPostalCode(body.postal) ? body.postal : null;
  const items = Array.isArray(body.items) ? body.items : [];
  if (
    !postal ||
    items.length === 0 ||
    items.length > 20 ||
    items.some((item) => typeof item.id !== "string" || !Number.isInteger(item.quantity) || item.quantity < 1)
  ) {
    return Response.json({ error: "Alamat atau keranjang tidak valid." }, { status: 400 });
  }

  try {
    const options = await getShippingOptions({
      postal,
      items: items.map((item) => ({ productId: item.id, quantity: item.quantity })),
    });
    if (options.length === 0) {
      return Response.json(
        { error: "Ongkos kirim otomatis belum tersedia untuk alamat ini. Lanjutkan saja, ongkir flat akan dipakai." },
        { status: 404 },
      );
    }
    return Response.json({ options });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Cek ongkir gagal. Coba lagi." }, { status: 503 });
  }
}
