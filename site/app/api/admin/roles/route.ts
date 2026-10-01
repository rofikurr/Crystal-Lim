import { eq } from "drizzle-orm";
import { db } from "../../../../db";
import { permissions, rolePermissions, roles } from "../../../../db/schema";
import { requirePermissionOrResponse } from "../../../../lib/auth/permissions";
import { sameOrigin } from "../../../../lib/auth/session";
import { nowForDb } from "../../../../lib/db-time";

export const dynamic = "force-dynamic";

async function serializeRoles() {
  const allRoles = await db.select().from(roles);
  const allPermissions = await db.select().from(permissions);
  const assignments = await db.select().from(rolePermissions);

  const permissionsByRole = new Map<number, string[]>();
  for (const a of assignments) {
    const permission = allPermissions.find((p) => p.id === a.permissionId);
    if (!permission) continue;
    const list = permissionsByRole.get(a.roleId) ?? [];
    list.push(permission.slug);
    permissionsByRole.set(a.roleId, list);
  }

  return {
    roles: allRoles.map((role) => ({
      id: role.id,
      slug: role.slug,
      name: role.name,
      isSystem: role.isSystem,
      permissions: permissionsByRole.get(role.id) ?? [],
    })),
    permissions: allPermissions.map((p) => ({
      id: p.id,
      slug: p.slug,
      label: p.label,
      group: p.group,
    })),
  };
}

export async function GET() {
  const { response } = await requirePermissionOrResponse("roles.manage");
  if (response) return response;
  try {
    return Response.json(await serializeRoles(), { headers: { "cache-control": "no-store" } });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Data role gagal dimuat." }, { status: 503 });
  }
}

const slugPattern = /^[a-z][a-z0-9_-]{1,63}$/;

export async function POST(request: Request) {
  const { response } = await requirePermissionOrResponse("roles.manage");
  if (response) return response;
  if (!sameOrigin(request)) {
    return Response.json({ error: "Permintaan tidak valid." }, { status: 403 });
  }
  let body: { slug?: string; name?: string; permissionSlugs?: string[] };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Data tidak valid." }, { status: 400 });
  }
  const slug = typeof body.slug === "string" ? body.slug.trim().toLowerCase() : "";
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const permissionSlugs = Array.isArray(body.permissionSlugs) ? body.permissionSlugs : [];
  if (!slugPattern.test(slug) || !name || name.length > 120) {
    return Response.json(
      { error: "Slug (huruf kecil, angka, - atau _) dan nama role wajib diisi." },
      { status: 400 },
    );
  }

  try {
    const existing = await db.select().from(roles).where(eq(roles.slug, slug)).limit(1);
    if (existing[0]) {
      return Response.json({ error: "Slug role sudah dipakai." }, { status: 409 });
    }

    const allPermissions = await db.select().from(permissions);
    const matched = allPermissions.filter((p) => permissionSlugs.includes(p.slug));

    const [inserted] = await db.insert(roles).values({
      slug,
      name,
      isSystem: false,
      createdAt: nowForDb(),
    });
    const roleId = inserted.insertId;

    if (matched.length > 0) {
      await db
        .insert(rolePermissions)
        .values(matched.map((p) => ({ roleId, permissionId: p.id })));
    }

    return Response.json({ ok: true, id: roleId }, { status: 201 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Role gagal dibuat." }, { status: 503 });
  }
}
