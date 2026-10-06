import { getEffectiveUser } from "../../../../lib/auth/permissions";
import { listWishlist } from "../../../../db/wishlist";

export async function GET() {
  const user = await getEffectiveUser();
  if (!user) return Response.json({ error: "Belum masuk." }, { status: 401 });
  try {
    return Response.json({ products: await listWishlist(user.id) }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Wishlist gagal dimuat." }, { status: 503 });
  }
}
