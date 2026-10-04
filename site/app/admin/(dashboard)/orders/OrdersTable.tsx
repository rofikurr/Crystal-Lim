"use client";

import { Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { money, STATUS_LABELS, type Order, type OrderStatus } from "./types";

const BADGE_VARIANT: Partial<Record<OrderStatus, "secondary" | "outline" | "destructive">> = {
  paid: "secondary",
  shipped: "secondary",
  completed: "secondary",
  cancelled: "destructive",
  expired: "outline",
};

const CHANGEABLE_STATUSES: OrderStatus[] = ["shipped", "completed", "cancelled"];

export default function OrdersTable({
  orders,
  busy,
  onDetail,
  onChangeStatus,
}: {
  orders: Order[];
  busy: boolean;
  onDetail: (order: Order) => void;
  onChangeStatus: (order: Order, status: OrderStatus) => void;
}) {
  if (orders.length === 0) {
    return <p className="py-10 text-center text-sm text-muted-foreground">Belum ada pesanan.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Pembeli</TableHead>
          <TableHead>Total</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Tanggal</TableHead>
          <TableHead className="text-right">Aksi</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order) => (
          <TableRow key={order.id}>
            <TableCell>
              <div className="flex flex-col">
                <span className="font-medium">{order.customerName}</span>
                <span className="text-xs text-muted-foreground">{order.customerEmail}</span>
              </div>
            </TableCell>
            <TableCell>{money.format(order.total)}</TableCell>
            <TableCell>
              <Badge variant={BADGE_VARIANT[order.status] ?? "outline"}>
                {STATUS_LABELS[order.status]}
              </Badge>
            </TableCell>
            <TableCell className="text-muted-foreground">{order.createdAt}</TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end items-center gap-1">
                {CHANGEABLE_STATUSES.includes(order.status) ||
                order.status === "paid" ? (
                  <NativeSelect
                    size="sm"
                    value=""
                    disabled={busy}
                    onChange={(e) => {
                      if (e.target.value) onChangeStatus(order, e.target.value as OrderStatus);
                      e.target.value = "";
                    }}
                  >
                    <NativeSelectOption value="">Ubah status…</NativeSelectOption>
                    {CHANGEABLE_STATUSES.map((status) => (
                      <NativeSelectOption key={status} value={status}>
                        {STATUS_LABELS[status]}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                ) : null}
                <Button variant="ghost" size="icon-sm" title="Lihat detail" onClick={() => onDetail(order)}>
                  <Eye className="size-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
