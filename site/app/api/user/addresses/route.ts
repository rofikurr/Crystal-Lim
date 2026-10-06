import { getEffectiveUser } from "../../../../lib/auth/permissions";
import { sameOrigin } from "../../../../lib/auth/session";
import { createAddress, listAddresses, type AddressInput } from "../../../../db/addresses";

const str = (value: unknown, max: number) =>
  typeof value === "string" && value.trim().length > 0 && value.trim().length <= max ? value.trim() : null;

function parseInput(body: Record<string, unknown>): AddressInput | null {
  const label = str(body.label, 40);
  const recipientName = str(body.recipientName, 140);
  const phone = str(body.phone, 32);
  const province = str(body.province, 80);
  const city = str(body.city, 80);
  const district = str(body.district, 80);
  const village = str(body.village, 80);
  const address = str(body.address, 2000);
  const postal = typeof body.postal === "string" && /^[0-9]{5}$/.test(body.postal) ? body.postal : null;
  if (!label || !recipientName || !phone || !province || !city || !district || !village || !address || !postal) {
    return null;
  }
  return {
    label,
    recipientName,
    phone,
    province,
    city,
    district,
    village,
    address,
    postal,
    isDefault: body.isDefault === true,
  };
}

export async function GET() {
  const user = await getEffectiveUser();
  if (!user) return Response.json({ error: "Belum masuk." }, { status: 401 });
  try {
    return Response.json({ addresses: await listAddresses(user.id) }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Alamat gagal dimuat." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const user = await getEffectiveUser();
  if (!user) return Response.json({ error: "Belum masuk." }, { status: 401 });
  if (!sameOrigin(request)) return Response.json({ error: "Permintaan tidak valid." }, { status: 403 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Data tidak valid." }, { status: 400 });
  }
  const input = parseInput(body);
  if (!input) return Response.json({ error: "Periksa kembali data alamat." }, { status: 400 });

  try {
    const address = await createAddress(user.id, input);
    return Response.json({ address }, { status: 201 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Alamat gagal disimpan." }, { status: 503 });
  }
}
