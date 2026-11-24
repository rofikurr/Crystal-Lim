"use client";

import { useState } from "react";
import { formatRupiah } from "@/lib/format";
import { useTranslation } from "@/lib/i18n/context";

type Point = { date: string; revenue: number; orderCount: number };

const DAY_LABEL = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short" });

function compactRupiah(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 1)}jt`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}rb`;
  return String(value);
}

/** Bulatkan ke angka "rapi" di atas nilai maksimum, untuk gridline sumbu Y. */
function niceMax(max: number): number {
  if (max <= 0) return 4;
  const magnitude = 10 ** Math.floor(Math.log10(max));
  const normalized = max / magnitude;
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return step * magnitude;
}

/** Bar dengan sudut atas membulat, dasar (baseline) tetap siku — bukan rect rx biasa. */
function roundedTopBarPath(x: number, y: number, w: number, h: number, r: number): string {
  const radius = Math.max(0, Math.min(r, w / 2, h));
  if (radius === 0) return `M${x},${y} h${w} v${h} h${-w} Z`;
  return `M${x},${y + radius} a${radius},${radius} 0 0 1 ${radius},${-radius} h${w - 2 * radius} a${radius},${radius} 0 0 1 ${radius},${radius} v${h - radius} h${-w} Z`;
}

export default function RevenueChart({ points }: { points: Point[] }) {
  const { t } = useTranslation();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const width = 700;
  const height = 220;
  const padding = { top: 16, right: 8, bottom: 24, left: 8 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  const maxRevenue = niceMax(Math.max(...points.map((p) => p.revenue), 0));
  const gridLines = [0, 0.25, 0.5, 0.75, 1];
  const bandWidth = plotWidth / points.length;
  const barWidth = Math.min(24, bandWidth * 0.55);
  const maxIndex = points.reduce((best, p, i) => (p.revenue > points[best].revenue ? i : best), 0);
  const hasRevenue = points.some((p) => p.revenue > 0);
  const activePoint = activeIndex !== null ? points[activeIndex] : null;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        role="img"
        aria-label={t("report.chartAriaLabel")}
      >
        {/* Gridline recessive, hairline solid */}
        {gridLines.map((fraction) => {
          const y = padding.top + plotHeight * (1 - fraction);
          return (
            <line
              key={fraction}
              x1={padding.left}
              x2={width - padding.right}
              y1={y}
              y2={y}
              stroke="var(--color-border)"
              strokeWidth={1}
            />
          );
        })}
        {!hasRevenue && (
          <text
            x={width / 2}
            y={height / 2}
            textAnchor="middle"
            className="fill-muted-foreground text-[13px]"
          >
            {t("report.noRevenuePeriod")}
          </text>
        )}
        {points.map((point, i) => {
          const barHeight = maxRevenue > 0 ? (point.revenue / maxRevenue) * plotHeight : 0;
          const x = padding.left + i * bandWidth + (bandWidth - barWidth) / 2;
          const y = padding.top + plotHeight - barHeight;
          const isActive = activeIndex === i;
          const showDirectLabel = i === maxIndex && point.revenue > 0;
          const showXLabel = points.length <= 10 || i % Math.ceil(points.length / 7) === 0;
          return (
            <g key={point.date}>
              {/* Hit target lebih lebar dari bar supaya mudah di-hover */}
              <rect
                x={padding.left + i * bandWidth}
                y={padding.top}
                width={bandWidth}
                height={plotHeight}
                fill="transparent"
                onPointerEnter={() => setActiveIndex(i)}
                onPointerLeave={() => setActiveIndex(null)}
                onFocus={() => setActiveIndex(i)}
                onBlur={() => setActiveIndex(null)}
                tabIndex={0}
                role="img"
                aria-label={`${DAY_LABEL.format(new Date(point.date))}: ${formatRupiah(point.revenue)}, ${t("report.ordersCount", { count: point.orderCount })}`}
              />
              {barHeight > 0 && (
                <path
                  d={roundedTopBarPath(x, y, barWidth, Math.max(barHeight, 2), 4)}
                  fill="var(--color-primary)"
                  opacity={isActive ? 1 : 0.85}
                />
              )}
              {showDirectLabel && (
                <text
                  x={x + barWidth / 2}
                  y={y - 6}
                  textAnchor="middle"
                  className="fill-foreground text-[11px] font-medium"
                >
                  {compactRupiah(point.revenue)}
                </text>
              )}
              {showXLabel && (
                <text
                  x={padding.left + i * bandWidth + bandWidth / 2}
                  y={height - 6}
                  textAnchor="middle"
                  className="fill-muted-foreground text-[10px]"
                >
                  {DAY_LABEL.format(new Date(point.date))}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      {activePoint && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-md border border-border bg-popover px-3 py-2 text-xs shadow-md"
          style={{
            left: `${((activeIndex! + 0.5) / points.length) * 100}%`,
            top: 0,
          }}
        >
          <p className="font-semibold text-popover-foreground">{formatRupiah(activePoint.revenue)}</p>
          <p className="text-muted-foreground">
            {DAY_LABEL.format(new Date(activePoint.date))} · {t("report.ordersCount", { count: activePoint.orderCount })}
          </p>
        </div>
      )}
    </div>
  );
}
