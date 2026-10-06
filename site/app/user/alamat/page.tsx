import AddressesClient from "./AddressesClient";

export const dynamic = "force-dynamic";

export default function AlamatPage() {
  return (
    <>
      <div>
        <p className="text-xs font-bold tracking-widest text-accent-foreground">AKUN SAYA</p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Alamat tersimpan</h1>
        <p className="mt-1 text-muted-foreground">
          Kelola alamat pengiriman biar lebih cepat saat checkout.
        </p>
      </div>
      <AddressesClient />
    </>
  );
}
