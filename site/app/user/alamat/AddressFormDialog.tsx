"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { patchJson, postJson } from "@/lib/api-client";
import { PHONE_PATTERN, POSTAL_PATTERN } from "@/lib/validation";
import { EMPTY_ADDRESS, type Address, type AddressInput } from "./types";
import { useTranslation } from "@/lib/i18n/context";

export default function AddressFormDialog({
  open,
  onOpenChange,
  address,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  address: Address | null;
  onSaved: () => void;
}) {
  const { t } = useTranslation();
  const [form, setForm] = useState<AddressInput>(EMPTY_ADDRESS);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(address ?? EMPTY_ADDRESS);
  }, [open, address]);

  function update<K extends keyof AddressInput>(key: K, value: AddressInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      if (address) {
        await patchJson(`/api/user/addresses/${address.id}`, form);
      } else {
        await postJson("/api/user/addresses", form);
      }
      toast.success(t("address.saved"));
      onOpenChange(false);
      onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("address.saveFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{address ? t("address.editTitle") : t("address.addTitle")}</DialogTitle>
          <DialogDescription>{t("address.formHint")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="addr-label">{t("address.label")}</Label>
              <Input
                id="addr-label"
                required
                maxLength={40}
                placeholder={t("address.labelPlaceholder")}
                value={form.label}
                onChange={(e) => update("label", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="addr-recipient">{t("address.recipientName")}</Label>
              <Input
                id="addr-recipient"
                required
                maxLength={140}
                value={form.recipientName}
                onChange={(e) => update("recipientName", e.target.value)}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="addr-phone">{t("common.whatsapp")}</Label>
              <Input
                id="addr-phone"
                required
                type="tel"
                pattern={PHONE_PATTERN.source}
                maxLength={20}
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="addr-province">{t("common.province")}</Label>
              <Input id="addr-province" required maxLength={80} value={form.province} onChange={(e) => update("province", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="addr-city">{t("common.city")}</Label>
              <Input id="addr-city" required maxLength={80} value={form.city} onChange={(e) => update("city", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="addr-district">{t("common.district")}</Label>
              <Input id="addr-district" required maxLength={80} value={form.district} onChange={(e) => update("district", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="addr-village">{t("common.village")}</Label>
              <Input id="addr-village" required maxLength={80} value={form.village} onChange={(e) => update("village", e.target.value)} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="addr-address">{t("common.fullAddress")}</Label>
              <Textarea
                id="addr-address"
                required
                rows={3}
                placeholder={t("common.addressPlaceholder")}
                value={form.address}
                onChange={(e) => update("address", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="addr-postal">{t("common.postal")}</Label>
              <Input
                id="addr-postal"
                required
                inputMode="numeric"
                pattern={POSTAL_PATTERN.source}
                maxLength={5}
                placeholder={t("common.postalPlaceholder")}
                value={form.postal}
                onChange={(e) => update("postal", e.target.value)}
              />
            </div>
            <div className="flex items-center sm:col-span-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <Checkbox
                  checked={form.isDefault}
                  onCheckedChange={(checked) => update("isDefault", checked === true)}
                />
                {t("address.setDefault")}
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? t("common.saving") : t("address.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
