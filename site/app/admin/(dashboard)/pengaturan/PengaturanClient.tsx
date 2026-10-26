"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/context";

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
  const { t } = useTranslation();
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
    if (!response.ok) throw new Error(data.error || t("settings.loadFailed"));
    setShippingFee(data.shippingFlatFee);
    setShippingMode(data.shippingMode);
    setShippingOrigin(data.shippingOrigin);
  }

  useEffect(() => {
    refresh()
      .catch((error) => toast.error(error instanceof Error ? error.message : t("settings.loadFailed")))
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
      if (!response.ok) throw new Error(data.error || t("settings.modeSaveFailed"));
      setShippingMode(mode);
      toast.success(mode === "flat" ? t("settings.modeFlatSuccess") : t("settings.modeAutoSuccess"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("settings.modeSaveFailed"));
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
      if (!response.ok) throw new Error(data.error || t("settings.feeSaveFailed"));
      toast.success(t("settings.feeSaved"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("settings.feeSaveFailed"));
    } finally {
      setSavingFee(false);
    }
  }

  async function searchOrigin() {
    if (originQuery.trim().length < 3) {
      toast.error(t("settings.minCharsError"));
      return;
    }
    setSearchingOrigin(true);
    try {
      const response = await fetch(`/api/admin/shipping/search-destination?q=${encodeURIComponent(originQuery)}`, {
        cache: "no-store",
      });
      const data = (await response.json()) as { error?: string; results: DestinationOption[] };
      if (!response.ok) throw new Error(data.error || t("settings.searchFailed"));
      setOriginResults(data.results);
      if (data.results.length === 0) toast.error(t("settings.noResults"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("settings.searchFailed"));
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
      if (!response.ok) throw new Error(data.error || t("settings.originSaveFailed"));
      setShippingOrigin({ id: option.id, label: option.label });
      setOriginResults([]);
      setOriginQuery("");
      toast.success(t("settings.originSaved"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("settings.originSaveFailed"));
    } finally {
      setSavingOrigin(false);
    }
  }

  if (loading) {
    return <p className="py-10 text-center text-sm text-muted-foreground">{t("settings.loading")}</p>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("settings.shippingModeTitle")}</CardTitle>
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
              <p className="font-semibold">{t("settings.flatLabel")}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("settings.flatDescription")}
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
              <p className="font-semibold">{t("settings.autoLabel")}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("settings.autoDescription")}
              </p>
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            {t("settings.modeNote")}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("settings.flatFeeTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={saveShippingFee} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="space-y-1.5">
              <Label htmlFor="shipping-fee">{t("settings.nominal")}</Label>
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
              {savingFee ? t("common.saving") : t("settings.saveShipping")}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("settings.shippingOriginTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">{t("settings.shippingOriginHint")}</p>
          {shippingOrigin && (
            <p className="text-sm text-muted-foreground">
              {t("settings.currentOrigin")} <span className="font-medium text-foreground">{shippingOrigin.label}</span>
            </p>
          )}
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              placeholder={t("settings.searchOriginPlaceholder")}
              className="sm:max-w-sm"
              value={originQuery}
              onChange={(e) => setOriginQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), searchOrigin())}
            />
            <Button type="button" variant="outline" disabled={searchingOrigin} onClick={searchOrigin}>
              {searchingOrigin ? t("settings.searching") : t("settings.search")}
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
