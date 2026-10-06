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
import type { Category } from "../types";

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
      const response = category
        ? await fetch(`/api/admin/products/categories/${category.id}`, {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ name, position }),
          })
        : await fetch("/api/admin/products/categories", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ name, position }),
          });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || "Kategori gagal disimpan.");
      toast.success(category ? "Kategori diperbarui." : "Kategori baru dibuat.");
      onOpenChange(false);
      onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Kategori gagal disimpan.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{category ? "Edit kategori" : "Tambah kategori"}</DialogTitle>
          <DialogDescription>
            Kategori ini akan muncul sebagai pilihan di form produk dan filter etalase.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="category-name">Nama kategori</Label>
            <Input
              id="category-name"
              required
              maxLength={120}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="category-position">Urutan tampil</Label>
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
              Batal
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? "Menyimpan…" : "Simpan kategori"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
