import { getEffectivePermissionSlugs } from "@/lib/auth/permissions";
import AccessDenied from "../../AccessDenied";
import CategoriesClient from "./CategoriesClient";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const permissions = await getEffectivePermissionSlugs();
  if (!permissions.includes("products.manage")) {
    return <AccessDenied message="Anda tidak memiliki izin untuk mengelola kategori." />;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <p className="text-xs font-bold tracking-widest text-accent-foreground">
          CATALOG MANAGEMENT
        </p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Kategori produk</h1>
        <p className="mt-1 text-muted-foreground">
          Kategori yang dipilih di sini otomatis muncul sebagai filter di etalase.
        </p>
      </div>
      <CategoriesClient />
    </div>
  );
}
