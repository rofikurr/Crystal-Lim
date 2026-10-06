import { getEffectiveUser } from "@/lib/auth/permissions";
import ProfileForm from "./ProfileForm";

export const dynamic = "force-dynamic";

export default async function ProfilPage() {
  const user = await getEffectiveUser();

  return (
    <>
      <div>
        <p className="text-xs font-bold tracking-widest text-accent-foreground">AKUN SAYA</p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Profil</h1>
        <p className="mt-1 text-muted-foreground">Ubah data diri dan password akun kamu.</p>
      </div>
      <ProfileForm
        initial={{ name: user?.name ?? "", phone: user?.phone ?? "", email: user?.email ?? "" }}
      />
    </>
  );
}
