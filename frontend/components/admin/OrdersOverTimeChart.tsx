"use client";

// Orders over time — bucketed client-side from recent orders' createdAt so the admin can
// flip between a week / month / 6 months / year and see the trend rise or fall.
import { useMemo, useRef, useState } from "react";

type Period = "week" | "month" | "6m" | "year";
const PERIODS: { key: Period; label: string }[] = [
  { key: "week", label: "Week" },
  { key: "month", label: "Month" },
  { key: "6m", label: "6 Months" },
  { key: "year", label: "Year" },
];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

interface Bucket {
  label: string;
  full: string;
  count: number;
}

function buildBuckets(period: Period, timestamps: string[]): Bucket[] {
  const now = new Date();
  const spans: { start: number; end: number; label: string; full: string }[] = [];

  if (period === "week" || period === "month") {
    const days = period === "week" ? 7 : 30;
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const next = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
      spans.push({
        start: d.getTime(),
        end: next.getTime(),
        label: `${d.getDate()}`,
        full: d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      });
    }
  } else {
    const months = period === "6m" ? 6 : 12;
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      spans.push({
        start: d.getTime(),
        end: next.getTime(),
        label: MONTHS[d.getMonth()],
        full: `${MONTHS[d.getMonth()]} ${d.getFullYear()}`,
      });
    }
  }

  const counts = new Array(spans.length).fill(0);
  for (const iso of timestamps) {
    const t = new Date(iso).getTime();
    if (Number.isNaN(t)) continue;
    for (let i = 0; i < spans.length; i++) {
      if (t >= spans[i].start && t < spans[i].end) {
        counts[i]++;
        break;
      }
    }
  }
  return spans.map((s, i) => ({ label: s.label, full: s.full, count: counts[i] }));
}

export function OrdersOverTimeChart({ timestamps }: { timestamps: string[] }) {
  const [period, setPeriod] = useState<Period>("month");
  const [tip, setTip] = useState<{ i: number; left: number; top: number } | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const buckets = useMemo(() => buildBuckets(period, timestamps), [period, timestamps]);
  const total = buckets.reduce((s, b) => s + b.count, 0);
  const max = Math.max(...buckets.map((b) => b.count), 1);

  const W = 760;
  const H = 240;
  const padL = 34;
  const padR = 12;
  const padT = 14;
  const padB = 26;
  const n = buckets.length;
  const bandW = (W - padL - padR) / n;
  const baseY = H - padB;
  const y = (v: number) => padT + (1 - v / (max * 1.1)) * (H - padT - padB);
  // for dense daily views, only label a few ticks
  const labelEvery = n > 14 ? Math.ceil(n / 8) : 1;
  const dotR = n > 20 ? 2.5 : n > 10 ? 3.2 : 4.2;

  // Line-chart geometry: one point per bucket, joined by straight segments that rise and
  // fall between the dots, with a soft area fill dropping to the baseline.
  const pts = buckets.map((b, i) => ({ x: padL + i * bandW + bandW / 2, cy: y(b.count) }));
  const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.cy.toFixed(1)}`).join(" ");
  const areaPath = pts.length
    ? `M ${pts[0].x.toFixed(1)} ${baseY} ${pts.map((p) => `L ${p.x.toFixed(1)} ${p.cy.toFixed(1)}`).join(" ")} L ${pts[pts.length - 1].x.toFixed(1)} ${baseY} Z`
    : "";

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    const relX = ((e.clientX - rect.left) / rect.width) * W - padL;
    const i = Math.max(0, Math.min(n - 1, Math.floor(relX / bandW)));
    const cx = padL + i * bandW + bandW / 2;
    setTip({ i, left: (cx / W) * rect.width, top: (y(buckets[i].count) / H) * rect.height });
  };

  return (
    <div>
      <div className="filter-row" style={{ marginBottom: 12 }} role="group" aria-label="Time range">
        {PERIODS.map((p) => (
          <button
            key={p.key}
            type="button"
            className={`f-chip${period === p.key ? " is-active" : ""}`}
            aria-pressed={period === p.key}
            onClick={() => {
              setPeriod(p.key);
              setTip(null);
            }}
          >
            {p.label}
          </button>
        ))}
        <span className="mono" style={{ marginLeft: "auto", fontSize: 12.5, color: "var(--text-secondary)", alignSelf: "center" }}>
          {total.toLocaleString()} order{total === 1 ? "" : "s"} in this range
        </span>
      </div>

      {total === 0 ? (
        <p style={{ color: "var(--text-secondary)", fontSize: 13, padding: "28px 0" }}>No orders in this range yet.</p>
      ) : (
        <div ref={wrapRef} style={{ position: "relative" }} onMouseMove={onMove} onMouseLeave={() => setTip(null)}>
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block" }} role="img" aria-label={`Orders over the selected ${period}`}>
            <defs>
              <linearGradient id="mtsa-oot-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.22" />
                <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
              </linearGradient>
            </defs>

            {Array.from({ length: 4 }, (_, i) => {
              const gy = padT + (i / 3) * (H - padT - padB);
              const val = Math.round(max * 1.1 * (1 - i / 3));
              return (
                <g key={`g${i}`}>
                  <line x1={padL} x2={W - padR} y1={gy} y2={gy} stroke="currentColor" opacity=".09" strokeWidth="1" />
                  <text x={padL - 7} y={gy + 4} textAnchor="end" fontSize="10.5" fontFamily="var(--font-mono)" fill="currentColor" opacity=".5">
                    {val}
                  </text>
                </g>
              );
            })}

            {/* soft fill under the trend, then the line that connects the dots */}
            {areaPath && <path d={areaPath} fill="url(#mtsa-oot-fill)" />}
            <path d={linePath} fill="none" stroke="var(--accent)" strokeWidth="2.25" strokeLinejoin="round" strokeLinecap="round" />

            {/* dashed guide down to the hovered point */}
            {tip && (
              <line x1={pts[tip.i].x} x2={pts[tip.i].x} y1={padT} y2={baseY} stroke="var(--accent-hover)" strokeWidth="1" strokeDasharray="3 3" opacity=".4" />
            )}

            {/* x-axis labels (sparse on dense daily views) */}
            {buckets.map((b, i) =>
              i % labelEvery === 0 ? (
                <text key={`x${i}`} x={pts[i].x} y={H - 8} textAnchor="middle" fontSize="10" fontFamily="var(--font-mono)" fill="currentColor" opacity=".5">
                  {b.label}
                </text>
              ) : null,
            )}

            {/* a dot on every data point */}
            {buckets.map((b, i) => {
              const active = tip?.i === i;
              return (
                <circle
                  key={`d${i}`}
                  cx={pts[i].x}
                  cy={pts[i].cy}
                  r={active ? dotR + 2.4 : dotR}
                  fill={active ? "var(--accent-hover)" : "var(--accent)"}
                  stroke="var(--bg-surface)"
                  strokeWidth={active ? 2.5 : 1.4}
                />
              );
            })}
          </svg>
          {tip && (
            <div className="chart-tip" style={{ left: tip.left, top: tip.top }}>
              {buckets[tip.i].full} · <b>{buckets[tip.i].count}</b>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
