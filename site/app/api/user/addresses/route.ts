import { getEffectiveUser } from "../../../../lib/auth/permissions";
import { sameOrigin } from "../../../../lib/auth/session";
import { createAddress, listAddresses } from "../../../../db/addresses";
import { parseAddressInput } from "./parse-input";

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
  const input = parseAddressInput(body);
  if (!input) return Response.json({ error: "Periksa kembali data alamat." }, { status: 400 });

  try {
    const address = await createAddress(user.id, input);
    return Response.json({ address }, { status: 201 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Alamat gagal disimpan." }, { status: 503 });
  }
}
