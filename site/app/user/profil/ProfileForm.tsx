"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { patchJson } from "@/lib/api-client";
import { PHONE_PATTERN } from "@/lib/validation";
import { useTranslation } from "@/lib/i18n/context";

export default function ProfileForm({
  initial,
}: {
  initial: { name: string; phone: string; email: string };
}) {
  const { t } = useTranslation();
  const [name, setName] = useState(initial.name);
  const [phone, setPhone] = useState(initial.phone);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      await patchJson("/api/user/profile", {
        name,
        phone,
        ...(newPassword ? { currentPassword, newPassword } : {}),
      });
      toast.success(t("profile.saved"));
      setCurrentPassword("");
      setNewPassword("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("profile.saveFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardContent>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="profile-email">{t("common.email")}</Label>
            <Input id="profile-email" value={initial.email} disabled />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="profile-name">{t("common.fullName")}</Label>
            <Input id="profile-name" required maxLength={140} value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="profile-phone">{t("common.whatsapp")}</Label>
            <Input
              id="profile-phone"
              required
              type="tel"
              pattern={PHONE_PATTERN.source}
              maxLength={20}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div className="space-y-1.5 border-t border-border pt-4">
            <Label htmlFor="profile-current-password">{t("profile.currentPassword")}</Label>
            <Input
              id="profile-current-password"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="profile-new-password">{t("profile.newPassword")}</Label>
            <Input
              id="profile-new-password"
              type="password"
              minLength={8}
              autoComplete="new-password"
              placeholder={t("profile.newPasswordPlaceholder")}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={busy}>
            {busy ? t("common.saving") : t("profile.saveChanges")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
