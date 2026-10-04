import { eq } from "drizzle-orm";
import { db } from "../db";
import { permissions, roles, rolePermissions, users } from "../db/schema";
import { hashPassword } from "../lib/auth/password";
import { nowForDb } from "../lib/db-time";

const PERMISSIONS = [
  { slug: "products.manage", label: "Kelola produk (tambah/edit/hapus)", group: "Produk" },
  { slug: "orders.manage", label: "Kelola pesanan & ongkir", group: "Pesanan" },
  { slug: "revenue.view", label: "Lihat laporan pendapatan", group: "Keuangan" },
  { slug: "roles.manage", label: "Kelola role & permission", group: "Pengguna" },
  { slug: "users.manage", label: "Kelola pengguna", group: "Pengguna" },
];

const ROLES = [
  { slug: "superadmin", name: "Super Admin", isSystem: true, permissionSlugs: [] as string[] },
  { slug: "admin", name: "Admin", isSystem: false, permissionSlugs: ["products.manage", "orders.manage"] },
  { slug: "user", name: "Pengguna", isSystem: false, permissionSlugs: [] },
];

async function main() {
  const now = nowForDb();

  for (const permission of PERMISSIONS) {
    const existing = await db
      .select()
      .from(permissions)
      .where(eq(permissions.slug, permission.slug))
      .limit(1);
    if (!existing[0]) {
      await db.insert(permissions).values(permission);
      console.log(`+ permission: ${permission.slug}`);
    }
  }

  const allPermissions = await db.select().from(permissions);

  for (const role of ROLES) {
    const existing = await db.select().from(roles).where(eq(roles.slug, role.slug)).limit(1);
    let roleId: number;
    if (!existing[0]) {
      const [inserted] = await db.insert(roles).values({
        slug: role.slug,
        name: role.name,
        isSystem: role.isSystem,
        createdAt: now,
      });
      roleId = inserted.insertId;
      console.log(`+ role: ${role.slug}`);
    } else {
      roleId = existing[0].id;
    }

    if (role.permissionSlugs.length > 0) {
      const matched = allPermissions.filter((p) => role.permissionSlugs.includes(p.slug));
      await db.delete(rolePermissions).where(eq(rolePermissions.roleId, roleId));
      await db.insert(rolePermissions).values(matched.map((p) => ({ roleId, permissionId: p.id })));
    }
  }

  const superadminEmail = process.env.SUPERADMIN_EMAIL;
  const superadminPassword = process.env.SUPERADMIN_PASSWORD;
  if (superadminEmail && superadminPassword) {
    const [superadminRole] = await db
      .select()
      .from(roles)
      .where(eq(roles.slug, "superadmin"))
      .limit(1);
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, superadminEmail.toLowerCase()))
      .limit(1);
    if (!existingUser[0]) {
      await db.insert(users).values({
        name: "Superadmin",
        email: superadminEmail.toLowerCase(),
        passwordHash: await hashPassword(superadminPassword),
        roleId: superadminRole.id,
        status: "active",
        createdAt: now,
        updatedAt: now,
      });
      console.log(`+ superadmin user: ${superadminEmail}`);
    } else {
      console.log(`= superadmin user sudah ada: ${superadminEmail}`);
    }
  } else {
    console.warn(
      "SUPERADMIN_EMAIL / SUPERADMIN_PASSWORD tidak diset di .env — lewati pembuatan akun superadmin.",
    );
  }

  console.log("Seed selesai.");
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
