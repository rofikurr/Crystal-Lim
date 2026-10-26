"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { patchJson, postJson } from "@/lib/api-client";
import type { Category } from "../types";
import { useTranslation } from "@/lib/i18n/context";

export default function CategoryFormDialog({
  open,
  onOpenChange,
  category,
  nextPosition,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: Category | null;
  nextPosition: number;
  onSaved: () => void;
}) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [position, setPosition] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(category?.name ?? "");
    setPosition(category?.position ?? nextPosition);
  }, [open, category, nextPosition]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      if (category) {
        await patchJson(`/api/admin/products/categories/${category.id}`, { name, position });
      } else {
        await postJson("/api/admin/products/categories", { name, position });
      }
      toast.success(category ? t("categories.form.updated") : t("categories.form.created"));
      onOpenChange(false);
      onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("categories.form.saveFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{category ? t("categories.form.editTitle") : t("categories.form.addTitle")}</DialogTitle>
          <DialogDescription>
            {t("categories.form.hint")}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="category-name">{t("categories.form.name")}</Label>
            <Input
              id="category-name"
              required
              maxLength={120}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="category-position">{t("categories.form.order")}</Label>
            <Input
              id="category-position"
              type="number"
              min={0}
              max={10000}
              value={position}
              onChange={(e) => setPosition(Number(e.target.value))}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? t("common.saving") : t("categories.form.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
