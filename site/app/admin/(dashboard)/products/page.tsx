import { getEffectivePermissionSlugs } from "@/lib/auth/permissions";
import AccessDenied from "../AccessDenied";
import AdminClient from "./AdminClient";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const permissions = await getEffectivePermissionSlugs();
  if (!permissions.includes("products.manage")) {
    return <AccessDenied message="Anda tidak memiliki izin untuk mengelola produk." />;
  }

  return <AdminClient canManageProducts />;
}
