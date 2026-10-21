"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type ShippingMode = "flat" | "auto";

type DestinationOption = {
  id: number;
  label: string;
  province: string;
  city: string;
  district: string;
  subdistrict: string;
  zipCode: string;
};

export default function PengaturanClient() {
  const [loading, setLoading] = useState(true);
  const [shippingMode, setShippingMode] = useState<ShippingMode>("auto");
  const [savingMode, setSavingMode] = useState(false);
  const [shippingFee, setShippingFee] = useState(0);
  const [savingFee, setSavingFee] = useState(false);
  const [shippingOrigin, setShippingOrigin] = useState<{ id: number; label: string } | null>(null);
  const [originQuery, setOriginQuery] = useState("");
  const [originResults, setOriginResults] = useState<DestinationOption[]>([]);
  const [searchingOrigin, setSearchingOrigin] = useState(false);
  const [savingOrigin, setSavingOrigin] = useState(false);

  async function refresh() {
    const response = await fetch("/api/admin/settings", { cache: "no-store" });
    const data = (await response.json()) as {
      error?: string;
      shippingFlatFee: number;
      shippingMode: ShippingMode;
      shippingOrigin: { id: number; label: string } | null;
    };
    if (!response.ok) throw new Error(data.error || "Pengaturan gagal dimuat.");
    setShippingFee(data.shippingFlatFee);
    setShippingMode(data.shippingMode);
    setShippingOrigin(data.shippingOrigin);
  }

  useEffect(() => {
    refresh()
      .catch((error) => toast.error(error instanceof Error ? error.message : "Pengaturan gagal dimuat."))
      .finally(() => setLoading(false));
  }, []);

  async function changeMode(mode: ShippingMode) {
    if (mode === shippingMode || savingMode) return;
    setSavingMode(true);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ shippingMode: mode }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || "Mode ongkir gagal disimpan.");
      setShippingMode(mode);
      toast.success(mode === "flat" ? "Ongkir sekarang flat untuk semua pesanan." : "Ongkir sekarang dihitung otomatis.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Mode ongkir gagal disimpan.");
    } finally {
      setSavingMode(false);
    }
  }

  async function saveShippingFee(event: React.FormEvent) {
    event.preventDefault();
    setSavingFee(true);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ shippingFlatFee: shippingFee }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || "Ongkir gagal disimpan.");
      toast.success("Ongkir flat disimpan.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ongkir gagal disimpan.");
    } finally {
      setSavingFee(false);
    }
  }

  async function searchOrigin() {
    if (originQuery.trim().length < 3) {
      toast.error("Ketik minimal 3 huruf.");
      return;
    }
    setSearchingOrigin(true);
    try {
      const response = await fetch(`/api/admin/shipping/search-destination?q=${encodeURIComponent(originQuery)}`, {
        cache: "no-store",
      });
      const data = (await response.json()) as { error?: string; results: DestinationOption[] };
      if (!response.ok) throw new Error(data.error || "Pencarian gagal.");
      setOriginResults(data.results);
      if (data.results.length === 0) toast.error("Tidak ada hasil, coba kata kunci lain.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Pencarian gagal.");
    } finally {
      setSearchingOrigin(false);
    }
  }

  async function pickOrigin(option: DestinationOption) {
    setSavingOrigin(true);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ shippingOriginId: option.id, shippingOriginLabel: option.label }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || "Alamat asal gagal disimpan.");
      setShippingOrigin({ id: option.id, label: option.label });
      setOriginResults([]);
      setOriginQuery("");
      toast.success("Alamat asal pengiriman disimpan.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Alamat asal gagal disimpan.");
    } finally {
      setSavingOrigin(false);
    }
  }

  if (loading) {
    return <p className="py-10 text-center text-sm text-muted-foreground">Memuat pengaturan…</p>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Mode ongkos kirim</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              disabled={savingMode}
              onClick={() => changeMode("flat")}
              className={cn(
                "flex-1 rounded-md border p-4 text-left transition-colors disabled:opacity-60",
                shippingMode === "flat" ? "border-primary bg-accent" : "border-border hover:bg-accent/50",
              )}
            >
              <p className="font-semibold">Flat</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Semua pesanan kena ongkir sama rata, berapapun jaraknya. Sederhana, tidak butuh RajaOngkir.
              </p>
            </button>
            <button
              type="button"
              disabled={savingMode}
              onClick={() => changeMode("auto")}
              className={cn(
                "flex-1 rounded-md border p-4 text-left transition-colors disabled:opacity-60",
                shippingMode === "auto" ? "border-primary bg-accent" : "border-border hover:bg-accent/50",
              )}
            >
              <p className="font-semibold">Otomatis (RajaOngkir)</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Ongkir dihitung real-time sesuai alamat & berat tiap pesanan. Perlu alamat asal diisi di bawah.
              </p>
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Mode ini menentukan yang BENERAN dipakai saat checkout — bukan sekadar perkiraan. Kalau mode
            Otomatis dipilih tapi alamat asal belum diisi, atau RajaOngkir sedang bermasalah, sistem otomatis
            jatuh ke ongkir flat di bawah supaya checkout tidak pernah gagal.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ongkir flat</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={saveShippingFee} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="space-y-1.5">
              <Label htmlFor="shipping-fee">Nominal (Rp)</Label>
              <Input
                id="shipping-fee"
                type="number"
                min={0}
                max={10000000}
                className="sm:w-48"
                value={shippingFee}
                onChange={(e) => setShippingFee(Number(e.target.value))}
              />
            </div>
            <Button type="submit" disabled={savingFee}>
              {savingFee ? "Menyimpan…" : "Simpan ongkir"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Alamat asal pengiriman</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">Dipakai untuk hitung ongkir RajaOngkir (mode Otomatis).</p>
          {shippingOrigin && (
            <p className="text-sm text-muted-foreground">
              Saat ini: <span className="font-medium text-foreground">{shippingOrigin.label}</span>
            </p>
          )}
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              placeholder="Cari kota/kecamatan asal pengiriman…"
              className="sm:max-w-sm"
              value={originQuery}
              onChange={(e) => setOriginQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), searchOrigin())}
            />
            <Button type="button" variant="outline" disabled={searchingOrigin} onClick={searchOrigin}>
              {searchingOrigin ? "Mencari…" : "Cari"}
            </Button>
          </div>
          {originResults.length > 0 && (
            <ul className="flex max-h-56 flex-col gap-1 overflow-y-auto rounded-md border border-border p-2">
              {originResults.map((option) => (
                <li key={option.id}>
                  <button
                    type="button"
                    disabled={savingOrigin}
                    onClick={() => pickOrigin(option)}
                    className="w-full rounded px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
                  >
                    {option.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
