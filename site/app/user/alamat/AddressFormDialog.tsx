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
import { EMPTY_ADDRESS, type Address, type AddressInput } from "./types";

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
      const response = address
        ? await fetch(`/api/user/addresses/${address.id}`, {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(form),
          })
        : await fetch("/api/user/addresses", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(form),
          });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || "Alamat gagal disimpan.");
      toast.success("Alamat tersimpan.");
      onOpenChange(false);
      onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Alamat gagal disimpan.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{address ? "Edit alamat" : "Tambah alamat"}</DialogTitle>
          <DialogDescription>Isi alamat lengkap buat pengiriman pesanan.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="addr-label">Label</Label>
              <Input
                id="addr-label"
                required
                maxLength={40}
                placeholder="Rumah, Kantor, dll"
                value={form.label}
                onChange={(e) => update("label", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="addr-recipient">Nama penerima</Label>
              <Input
                id="addr-recipient"
                required
                maxLength={140}
                value={form.recipientName}
                onChange={(e) => update("recipientName", e.target.value)}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="addr-phone">Nomor WhatsApp</Label>
              <Input
                id="addr-phone"
                required
                type="tel"
                pattern="[+0-9 ()-]{9,20}"
                maxLength={20}
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="addr-province">Provinsi</Label>
              <Input id="addr-province" required maxLength={80} value={form.province} onChange={(e) => update("province", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="addr-city">Kota/Kabupaten</Label>
              <Input id="addr-city" required maxLength={80} value={form.city} onChange={(e) => update("city", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="addr-district">Kecamatan</Label>
              <Input id="addr-district" required maxLength={80} value={form.district} onChange={(e) => update("district", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="addr-village">Kelurahan/Desa</Label>
              <Input id="addr-village" required maxLength={80} value={form.village} onChange={(e) => update("village", e.target.value)} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="addr-address">Alamat lengkap</Label>
              <Textarea
                id="addr-address"
                required
                rows={3}
                placeholder="Nama jalan, nomor rumah, RT/RW, patokan"
                value={form.address}
                onChange={(e) => update("address", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="addr-postal">Kode pos</Label>
              <Input
                id="addr-postal"
                required
                inputMode="numeric"
                pattern="[0-9]{5}"
                maxLength={5}
                placeholder="5 digit"
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
                Jadikan alamat utama
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? "Menyimpan…" : "Simpan alamat"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
