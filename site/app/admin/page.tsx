import { requireChatGPTUser, chatGPTSignOutPath } from "../chatgpt-auth";
import { getAdmin } from "./auth";
import AdminClient from "./AdminClient";
import "./admin.css";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireChatGPTUser("/admin");
  const admin = await getAdmin();
  if (!admin) return <main className="admin-denied"><h1>Akses admin terbatas</h1><p>Akun ini belum diizinkan mengelola Crystal Lim.</p><a href={chatGPTSignOutPath("/admin")}>Gunakan akun lain</a></main>;
  return <AdminClient email={admin.email} />;
}
