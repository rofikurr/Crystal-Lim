import { createRole, findRoleBySlug, listRolesWithPermissions } from "../../../../db/roles";
import {
  requireAnyPermissionOrResponse,
  requirePermissionOrResponse,
} from "../../../../lib/auth/permissions";
import { sameOrigin } from "../../../../lib/auth/session";
import { nowForDb } from "../../../../lib/db-time";
import { ROLE_SLUG_PATTERN } from "../../../../lib/validation";

export const dynamic = "force-dynamic";

export async function GET() {
  // Dibutuhkan juga oleh halaman Manajemen User (buat dropdown pilihan role),
  // jadi cukup punya salah satu dari kedua permission ini.
  const { response } = await requireAnyPermissionOrResponse(["roles.manage", "users.manage"]);
  if (response) return response;
  try {
    return Response.json(await listRolesWithPermissions(), { headers: { "cache-control": "no-store" } });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Data role gagal dimuat." }, { status: 503 });
  }
}

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
  if (!ROLE_SLUG_PATTERN.test(slug) || !name || name.length > 120) {
    return Response.json(
      { error: "Slug (huruf kecil, angka, - atau _) dan nama role wajib diisi." },
      { status: 400 },
    );
  }

  try {
    const existing = await findRoleBySlug(slug);
    if (existing) {
      return Response.json({ error: "Slug role sudah dipakai." }, { status: 409 });
    }

    const id = await createRole({ slug, name, permissionSlugs, createdAt: nowForDb() });
    return Response.json({ ok: true, id }, { status: 201 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Role gagal dibuat." }, { status: 503 });
  }
}
