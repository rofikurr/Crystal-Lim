"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { patchJson } from "@/lib/api-client";
import { money, STATUS_KEYS, type Order } from "./types";
import { useTranslation } from "@/lib/i18n/context";

export default function OrderDetailSheet({
  order,
  open,
  onOpenChange,
  onSaved,
}: {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => Promise<void>;
}) {
  const { t } = useTranslation();
  const [trackingNumber, setTrackingNumber] = useState("");
  const [savingTracking, setSavingTracking] = useState(false);

  useEffect(() => {
    setTrackingNumber(order?.trackingNumber ?? "");
  }, [order]);

  async function saveTrackingNumber() {
    if (!order) return;
    setSavingTracking(true);
    try {
      await patchJson(`/api/admin/orders/${encodeURIComponent(order.id)}`, { trackingNumber });
      await onSaved();
      toast.success(t("orders.detail.trackingSaved"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("orders.detail.trackingSaveFailed"));
    } finally {
      setSavingTracking(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        {order && (
          <>
            <SheetHeader>
              <SheetTitle>{order.customerName}</SheetTitle>
              <SheetDescription>{order.id}</SheetDescription>
            </SheetHeader>
            <div className="flex flex-col gap-4 px-4 pb-4">
              <Badge className="w-fit">{t(STATUS_KEYS[order.status])}</Badge>
              <div>
                <p className="text-sm font-semibold">{t("orders.detail.contact")}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {order.customerEmail} · {order.customerPhone}
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold">{t("orders.detail.shippingAddress")}</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                  {order.shippingAddress}
                </p>
                {order.notes && (
                  <p className="mt-1 text-sm text-muted-foreground">{t("orders.detail.notes", { notes: order.notes })}</p>
                )}
              </div>
              <div>
                <p className="text-sm font-semibold">{t("orders.detail.products")}</p>
                <div className="mt-2 flex flex-col gap-2">
                  {order.items.map((item, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.productImage}
                        alt=""
                        className="size-10 shrink-0 rounded-md border border-border object-cover"
                      />
                      <div className="flex-1">
                        <p className="font-medium">{item.productName}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.quantity} × {money.format(item.unitPrice)}
                        </p>
                      </div>
                      <p className="font-medium">{money.format(item.unitPrice * item.quantity)}</p>
                    </div>
                  ))}
                </div>
              </div>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                <dt className="text-muted-foreground">{t("common.subtotal")}</dt>
                <dd className="text-right font-medium">{money.format(order.subtotal)}</dd>
                <dt className="text-muted-foreground">{t("common.shippingFee")}</dt>
                <dd className="text-right font-medium">{money.format(order.shippingFee)}</dd>
                <dt className="text-muted-foreground">{t("common.total")}</dt>
                <dd className="text-right font-semibold">{money.format(order.total)}</dd>
              </dl>
              <div className="space-y-1.5">
                <Label htmlFor="order-tracking-number">{t("orders.detail.trackingNumber")}</Label>
                <div className="flex gap-2">
                  <Input
                    id="order-tracking-number"
                    placeholder={t("orders.detail.trackingPlaceholder")}
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                  />
                  <Button type="button" disabled={savingTracking} onClick={saveTrackingNumber}>
                    {savingTracking ? t("common.saving") : t("common.save")}
                  </Button>
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold">{t("orders.detail.createdAt")}</p>
                <p className="mt-1 text-sm text-muted-foreground">{order.createdAt}</p>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
