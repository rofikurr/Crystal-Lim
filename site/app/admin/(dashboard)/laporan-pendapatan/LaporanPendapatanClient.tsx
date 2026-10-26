"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, TrendingDown, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatRupiah } from "@/lib/format";
import { cn } from "@/lib/utils";
import { money, STATUS_KEYS, type Order, type OrderStatus } from "../orders/types";
import RevenueChart from "../RevenueChart";
import { useTranslation } from "@/lib/i18n/context";
import type { TranslationKey } from "@/lib/i18n/translations";

type Period = "today" | "7d" | "30d" | "month" | "year" | "custom";

const PERIODS: { key: Period; labelKey: TranslationKey }[] = [
  { key: "today", labelKey: "report.period.today" },
  { key: "7d", labelKey: "report.period.7d" },
  { key: "30d", labelKey: "report.period.30d" },
  { key: "month", labelKey: "report.period.month" },
  { key: "year", labelKey: "report.period.year" },
  { key: "custom", labelKey: "report.period.custom" },
];

const PAGE_SIZE = 10;

type Summary = {
  revenue: number;
  orderCount: number;
  averageOrderValue: number;
  previousRevenue: number;
  previousOrderCount: number;
};

type SeriesPoint = { date: string; revenue: number; orderCount: number };
type CategoryPoint = { categoryId: number; categoryName: string; quantity: number; revenue: number };

type ReportData = {
  summary: Summary;
  series: SeriesPoint[];
  categories: CategoryPoint[];
  orders: { orders: Order[]; total: number; page: number; pageSize: number };
};

function todayUTC(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

function computeRange(period: Period, customFrom: string, customTo: string): { from: string; to: string } | null {
  const today = todayUTC();
  switch (period) {
    case "today":
      return { from: toISODate(today), to: toISODate(today) };
    case "7d":
      return { from: toISODate(addDays(today, -6)), to: toISODate(today) };
    case "30d":
      return { from: toISODate(addDays(today, -29)), to: toISODate(today) };
    case "month":
      return { from: toISODate(new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1))), to: toISODate(today) };
    case "year":
      return { from: toISODate(new Date(Date.UTC(today.getUTCFullYear(), 0, 1))), to: toISODate(today) };
    case "custom":
      return customFrom && customTo ? { from: customFrom, to: customTo } : null;
  }
}

const BADGE_VARIANT: Partial<Record<OrderStatus, "secondary" | "outline" | "destructive">> = {
  paid: "secondary",
  shipped: "secondary",
  completed: "secondary",
  cancelled: "destructive",
  expired: "outline",
};

function PercentBadge({ current, previous }: { current: number; previous: number }) {
  const { t } = useTranslation();
  if (previous === 0 && current === 0) return null;
  const pct = previous > 0 ? ((current - previous) / previous) * 100 : 100;
  const up = pct >= 0;
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-medium", up ? "text-green-600" : "text-red-600")}>
      {up ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
      {Math.abs(pct).toFixed(0)}% {t("report.vsPreviousPeriod")}
    </span>
  );
}

export default function LaporanPendapatanClient() {
  const { t } = useTranslation();
  const [period, setPeriod] = useState<Period>("30d");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  const range = useMemo(() => computeRange(period, customFrom, customTo), [period, customFrom, customTo]);

  useEffect(() => {
    setPage(1);
  }, [period, customFrom, customTo]);

  useEffect(() => {
    if (!range) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const params = new URLSearchParams({ from: range.from, to: range.to, page: String(page), pageSize: String(PAGE_SIZE) });
    fetch(`/api/admin/reports/revenue?${params}`, { cache: "no-store" })
      .then(async (response) => {
        const json = (await response.json()) as ReportData & { error?: string };
        if (!response.ok) throw new Error(json.error || t("report.loadFailed"));
        setData(json);
      })
      .catch((error) => toast.error(error instanceof Error ? error.message : t("report.loadFailed")))
      .finally(() => setLoading(false));
  }, [range, page]);

  function exportCsv() {
    if (!range) return;
    const params = new URLSearchParams({ from: range.from, to: range.to, format: "csv" });
    window.open(`/api/admin/reports/revenue?${params}`, "_blank");
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.orders.total / data.orders.pageSize)) : 1;

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap gap-2">
            {PERIODS.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => setPeriod(p.key)}
                className={cn(
                  "rounded-md border px-3 py-1.5 text-sm font-medium transition-colors",
                  period === p.key ? "border-primary bg-accent" : "border-border hover:bg-accent/50",
                )}
              >
                {t(p.labelKey)}
              </button>
            ))}
          </div>
          {period === "custom" && (
            <div className="flex items-end gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="report-from">{t("report.from")}</Label>
                <Input id="report-from" type="date" value={customFrom} max={customTo || undefined} onChange={(e) => setCustomFrom(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="report-to">{t("report.to")}</Label>
                <Input id="report-to" type="date" value={customTo} min={customFrom || undefined} onChange={(e) => setCustomTo(e.target.value)} />
              </div>
            </div>
          )}
          <Button type="button" variant="outline" className="ml-auto" disabled={!range} onClick={exportCsv}>
            <Download className="size-4" /> {t("report.exportCsv")}
          </Button>
        </CardContent>
      </Card>

      {!range ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            {t("report.selectCustomRange")}
          </CardContent>
        </Card>
      ) : loading || !data ? (
        <p className="py-10 text-center text-sm text-muted-foreground">{t("report.loading")}</p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card>
              <CardContent>
                <p className="text-sm text-muted-foreground">{t("report.totalRevenue")}</p>
                <p className="mt-1 text-2xl font-bold">{formatRupiah(data.summary.revenue)}</p>
                <PercentBadge current={data.summary.revenue} previous={data.summary.previousRevenue} />
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <p className="text-sm text-muted-foreground">{t("report.orderCount")}</p>
                <p className="mt-1 text-2xl font-bold">{data.summary.orderCount}</p>
                <PercentBadge current={data.summary.orderCount} previous={data.summary.previousOrderCount} />
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <p className="text-sm text-muted-foreground">{t("report.averageOrderValue")}</p>
                <p className="mt-1 text-2xl font-bold">{formatRupiah(data.summary.averageOrderValue)}</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>{t("report.dailyTrend")}</CardTitle>
              </CardHeader>
              <CardContent>
                <RevenueChart points={data.series} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>{t("report.byCategory")}</CardTitle>
              </CardHeader>
              <CardContent>
                {data.categories.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t("admin.dashboard.noSalesPeriod")}</p>
                ) : (
                  <ol className="space-y-3">
                    {data.categories.map((category) => (
                      <li key={category.categoryId} className="flex items-center justify-between gap-3 text-sm">
                        <span className="truncate">{category.categoryName}</span>
                        <span className="shrink-0 text-right">
                          <span className="block font-medium">{formatRupiah(category.revenue)}</span>
                          <span className="block text-xs text-muted-foreground">{category.quantity} {t("admin.dashboard.sold")}</span>
                        </span>
                      </li>
                    ))}
                  </ol>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t("report.transactionDetail")}</CardTitle>
            </CardHeader>
            <CardContent>
              {data.orders.orders.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">{t("report.noTransactionsPeriod")}</p>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("orders.table.date")}</TableHead>
                        <TableHead>{t("orders.table.buyer")}</TableHead>
                        <TableHead>{t("orders.table.status")}</TableHead>
                        <TableHead>{t("common.total")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.orders.orders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="text-muted-foreground">{order.createdAt}</TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{order.customerName}</span>
                              <span className="text-xs text-muted-foreground">{order.customerEmail}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={BADGE_VARIANT[order.status] ?? "outline"}>{t(STATUS_KEYS[order.status])}</Badge>
                          </TableCell>
                          <TableCell>{money.format(order.total)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      {t("report.pageOf", { page: data.orders.page, total: totalPages, count: data.orders.total })}
                    </p>
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                        {t("report.previous")}
                      </Button>
                      <Button type="button" variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                        {t("report.next")}
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
