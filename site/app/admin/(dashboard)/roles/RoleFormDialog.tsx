"use client";

import { useState } from "react";
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
import { postJson } from "@/lib/api-client";
import type { Permission } from "./types";
import { useTranslation } from "@/lib/i18n/context";

export default function RoleFormDialog({
  open,
  onOpenChange,
  permissions,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  permissions: Permission[];
  onCreated: () => void;
}) {
  const { t } = useTranslation();
  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const grouped = permissions.reduce<Record<string, Permission[]>>((acc, p) => {
    (acc[p.group] ??= []).push(p);
    return acc;
  }, {});

  function reset() {
    setSlug("");
    setName("");
    setSelected([]);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      await postJson("/api/admin/roles", { slug, name, permissionSlugs: selected });
      toast.success(t("roles.form.created"));
      reset();
      onOpenChange(false);
      onCreated();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("roles.form.createFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("roles.form.title")}</DialogTitle>
          <DialogDescription>
            {t("roles.form.hint")}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="role-slug">{t("roles.form.slug")}</Label>
            <Input
              id="role-slug"
              required
              pattern="[a-z][a-z0-9_-]{1,63}"
              placeholder="finance"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="role-name">{t("roles.form.name")}</Label>
            <Input
              id="role-name"
              required
              placeholder="Admin Finance"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-3">
            <Label>{t("roles.form.permissions")}</Label>
            {Object.entries(grouped).map(([group, perms]) => (
              <fieldset key={group} className="rounded-md border border-border p-3">
                <legend className="px-1 text-xs font-semibold text-muted-foreground">
                  {group}
                </legend>
                <div className="flex flex-col gap-2">
                  {perms.map((p) => (
                    <label key={p.slug} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={selected.includes(p.slug)}
                        onCheckedChange={(checked) =>
                          setSelected((prev) =>
                            checked === true
                              ? [...prev, p.slug]
                              : prev.filter((s) => s !== p.slug),
                          )
                        }
                      />
                      {p.label}
                    </label>
                  ))}
                </div>
              </fieldset>
            ))}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? t("common.saving") : t("roles.form.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
