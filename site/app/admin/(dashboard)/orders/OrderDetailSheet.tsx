"use client";

import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { money, STATUS_LABELS, type Order } from "./types";

export default function OrderDetailSheet({
  order,
  open,
  onOpenChange,
}: {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
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
              <Badge className="w-fit">{STATUS_LABELS[order.status]}</Badge>
              <div>
                <p className="text-sm font-semibold">Kontak</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {order.customerEmail} · {order.customerPhone}
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold">Alamat pengiriman</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                  {order.shippingAddress}
                </p>
                {order.notes && (
                  <p className="mt-1 text-sm text-muted-foreground">Catatan: {order.notes}</p>
                )}
              </div>
              <div>
                <p className="text-sm font-semibold">Produk</p>
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
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="text-right font-medium">{money.format(order.subtotal)}</dd>
                <dt className="text-muted-foreground">Ongkir</dt>
                <dd className="text-right font-medium">{money.format(order.shippingFee)}</dd>
                <dt className="text-muted-foreground">Total</dt>
                <dd className="text-right font-semibold">{money.format(order.total)}</dd>
              </dl>
              <div>
                <p className="text-sm font-semibold">Dibuat</p>
                <p className="mt-1 text-sm text-muted-foreground">{order.createdAt}</p>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
