import { requirePermissionOrResponse } from "../../../../../lib/auth/permissions";
import {
  getRevenueByCategory,
  getRevenueSummary,
  getRevenueTimeSeries,
  listAllOrdersInRange,
  listOrdersInRange,
} from "../../../../../db/orders";

export const dynamic = "force-dynamic";

const MAX_RANGE_DAYS = 370;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function parseRange(searchParams: URLSearchParams): { from: Date; to: Date } | { error: string } {
  const fromParam = searchParams.get("from") ?? "";
  const toParam = searchParams.get("to") ?? "";
  if (!DATE_RE.test(fromParam) || !DATE_RE.test(toParam)) {
    return { error: "Parameter from/to harus format YYYY-MM-DD." };
  }
  const from = new Date(`${fromParam}T00:00:00.000Z`);
  const to = new Date(`${toParam}T23:59:59.999Z`);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from.getTime() > to.getTime()) {
    return { error: "Rentang tanggal tidak valid." };
  }
  const rangeDays = (to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000);
  if (rangeDays > MAX_RANGE_DAYS) {
    return { error: `Rentang tanggal maksimal ${MAX_RANGE_DAYS} hari.` };
  }
  return { from, to };
}

function csvEscape(value: string | number): string {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function buildCsv(orders: Awaited<ReturnType<typeof listAllOrdersInRange>>): string {
  const header = ["Tanggal", "ID Pesanan", "Pembeli", "Email", "Status", "Subtotal", "Ongkir", "Total", "Resi"];
  const rows = orders.map((order) => [
    order.createdAt,
    order.id,
    order.customerName,
    order.customerEmail,
    order.status,
    order.subtotal,
    order.shippingFee,
    order.total,
    order.trackingNumber,
  ]);
  return [header, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");
}

export async function GET(request: Request) {
  const { response } = await requirePermissionOrResponse("orders.manage");
  if (response) return response;

  const { searchParams } = new URL(request.url);
  const range = parseRange(searchParams);
  if ("error" in range) return Response.json({ error: range.error }, { status: 400 });
  const { from, to } = range;

  try {
    if (searchParams.get("format") === "csv") {
      const orders = await listAllOrdersInRange(from, to);
      return new Response(buildCsv(orders), {
        headers: {
          "content-type": "text/csv; charset=utf-8",
          "content-disposition": `attachment; filename="laporan-pendapatan-${searchParams.get("from")}-${searchParams.get("to")}.csv"`,
        },
      });
    }

    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const pageSize = Math.min(50, Math.max(1, Number(searchParams.get("pageSize")) || 10));

    const [summary, series, categories, orders] = await Promise.all([
      getRevenueSummary(from, to),
      getRevenueTimeSeries(from, to),
      getRevenueByCategory(from, to),
      listOrdersInRange(from, to, page, pageSize),
    ]);

    return Response.json({ summary, series, categories, orders }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    console.error("Laporan pendapatan gagal dimuat", error);
    return Response.json({ error: "Laporan pendapatan gagal dimuat." }, { status: 503 });
  }
}
