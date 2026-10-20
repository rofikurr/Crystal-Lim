import { getEffectiveUser } from "../../../../../lib/auth/permissions";
import { sameOrigin } from "../../../../../lib/auth/session";
import { deleteAddress, updateAddress } from "../../../../../db/addresses";
import { parseAddressInput } from "../parse-input";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getEffectiveUser();
  if (!user) return Response.json({ error: "Belum masuk." }, { status: 401 });
  if (!sameOrigin(request)) return Response.json({ error: "Permintaan tidak valid." }, { status: 403 });
  const { id } = await context.params;
  const addressId = Number(id);
  if (!Number.isInteger(addressId)) return Response.json({ error: "Alamat tidak ditemukan." }, { status: 404 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Data tidak valid." }, { status: 400 });
  }
  const input = parseAddressInput(body);
  if (!input) return Response.json({ error: "Periksa kembali data alamat." }, { status: 400 });

  try {
    await updateAddress(user.id, addressId, input);
    return Response.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Alamat gagal diperbarui.";
    return Response.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getEffectiveUser();
  if (!user) return Response.json({ error: "Belum masuk." }, { status: 401 });
  if (!sameOrigin(request)) return Response.json({ error: "Permintaan tidak valid." }, { status: 403 });
  const { id } = await context.params;
  const addressId = Number(id);
  if (!Number.isInteger(addressId)) return Response.json({ error: "Alamat tidak ditemukan." }, { status: 404 });

  try {
    await deleteAddress(user.id, addressId);
    return Response.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Alamat gagal dihapus.";
    return Response.json({ error: message }, { status: 400 });
  }
}
