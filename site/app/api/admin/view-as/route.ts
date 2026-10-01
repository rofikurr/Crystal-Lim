import { getCurrentUser } from "../../../../lib/auth/permissions";
import { clearViewAsRole, sameOrigin, setViewAsRole } from "../../../../lib/auth/session";

export async function POST(request: Request) {
  if (!sameOrigin(request)) {
    return Response.json({ error: "Permintaan tidak valid." }, { status: 403 });
  }
  const user = await getCurrentUser();
  if (!user || !user.isSystem) {
    return Response.json({ error: "Akses ditolak." }, { status: 403 });
  }
  let body: { roleSlug?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Data tidak valid." }, { status: 400 });
  }
  if (!body.roleSlug) {
    return Response.json({ error: "roleSlug wajib diisi." }, { status: 400 });
  }
  await setViewAsRole(body.roleSlug);
  return Response.json({ ok: true });
}

export async function DELETE(request: Request) {
  if (!sameOrigin(request)) {
    return Response.json({ error: "Permintaan tidak valid." }, { status: 403 });
  }
  const user = await getCurrentUser();
  if (!user || !user.isSystem) {
    return Response.json({ error: "Akses ditolak." }, { status: 403 });
  }
  await clearViewAsRole();
  return Response.json({ ok: true });
}
