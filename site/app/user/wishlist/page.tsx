import WishlistClient from "./WishlistClient";

export const dynamic = "force-dynamic";

export default function WishlistPage() {
  return (
    <>
      <div>
        <p className="text-xs font-bold tracking-widest text-accent-foreground">AKUN SAYA</p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Wishlist</h1>
        <p className="mt-1 text-muted-foreground">Produk yang kamu simpan buat dibeli nanti.</p>
      </div>
      <WishlistClient />
    </>
  );
}
