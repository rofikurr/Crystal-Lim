import { getEffectivePermissionSlugs } from "@/lib/auth/permissions";
import AdminClient from "./AdminClient";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const permissions = await getEffectivePermissionSlugs();
  if (!permissions.includes("products.manage")) {
    return (
      <div className="admin-denied">
        <h1>Akses terbatas</h1>
        <p>Anda tidak memiliki izin untuk mengelola produk.</p>
      </div>
    );
  }

  return <AdminClient canManageProducts />;
}
