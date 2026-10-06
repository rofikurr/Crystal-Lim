import { getEffectiveUser } from "../../../../../lib/auth/permissions";
import { sameOrigin } from "../../../../../lib/auth/session";
import { addWishlist, removeWishlist } from "../../../../../db/wishlist";

export async function POST(request: Request, context: { params: Promise<{ productId: string }> }) {
  const user = await getEffectiveUser();
  if (!user) return Response.json({ error: "Belum masuk." }, { status: 401 });
  if (!sameOrigin(request)) return Response.json({ error: "Permintaan tidak valid." }, { status: 403 });
  const { productId } = await context.params;
  try {
    await addWishlist(user.id, productId);
    return Response.json({ ok: true });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Wishlist gagal disimpan." }, { status: 503 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ productId: string }> }) {
  const user = await getEffectiveUser();
  if (!user) return Response.json({ error: "Belum masuk." }, { status: 401 });
  if (!sameOrigin(request)) return Response.json({ error: "Permintaan tidak valid." }, { status: 403 });
  const { productId } = await context.params;
  try {
    await removeWishlist(user.id, productId);
    return Response.json({ ok: true });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Wishlist gagal dihapus." }, { status: 503 });
  }
}
