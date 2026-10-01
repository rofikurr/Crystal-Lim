import { db } from "@/db";
import { listProducts } from "@/db/catalog";
import { roles, users } from "@/db/schema";
import { getEffectivePermissionSlugs } from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const permissions = await getEffectivePermissionSlugs();
  const products = await listProducts(true);

  const totalUsers = permissions.includes("users.manage")
    ? (await db.select().from(users)).length
    : null;
  const totalRoles = permissions.includes("roles.manage")
    ? (await db.select().from(roles)).length
    : null;

  return (
    <div className="admin-content">
      <div className="admin-intro">
        <div>
          <p>OVERVIEW</p>
          <h1>Dashboard</h1>
          <span>Ringkasan toko Crystal Lim.</span>
        </div>
      </div>
      <div className="admin-stats">
        <div>
          <b>{products.length}</b>
          <span>Total produk</span>
        </div>
        <div>
          <b>{products.filter((p) => p.published).length}</b>
          <span>Tampil di toko</span>
        </div>
        <div>
          <b>{products.filter((p) => p.bestSeller).length}</b>
          <span>Best seller</span>
        </div>
        {totalUsers !== null && (
          <div>
            <b>{totalUsers}</b>
            <span>Total user</span>
          </div>
        )}
        {totalRoles !== null && (
          <div>
            <b>{totalRoles}</b>
            <span>Total role</span>
          </div>
        )}
      </div>
      <p className="admin-footnote">
        Laporan pendapatan: belum ada data — sistem order/checkout belum aktif.
      </p>
    </div>
  );
}
