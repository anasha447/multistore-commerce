"use client";

import { useRef, useState } from "react";
import { formatMoney, formatMoneyShort } from "@/lib/utils/money";
import type { RevenueTrendPoint } from "@/lib/api";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function monthLabel(ym: string): string {
  const m = Number(ym.slice(5, 7));
  return MONTHS[m - 1] ?? ym;
}

/** Revenue trend: SVG area + line with a hover tooltip. */
export function TrendChart({ data, height = 220 }: { data: RevenueTrendPoint[]; height?: number }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [tip, setTip] = useState<{ i: number; left: number; top: number } | null>(null);

  if (data.length < 2) {
    return <p style={{ color: "var(--text-secondary)", fontSize: 13, padding: "24px 0" }}>Not enough data yet.</p>;
  }

  const W = 720;
  const H = height;
  const padL = 46;
  const padR = 14;
  const padT = 16;
  const padB = 28;
  const max = Math.max(...data.map((d) => d.revenue), 1) * 1.12;
  const x = (i: number) => padL + (i / (data.length - 1)) * (W - padL - padR);
  const y = (v: number) => padT + (1 - v / max) * (H - padT - padB);
  const pts = data.map((d, i) => [x(i), y(d.revenue)] as const);
  const line = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  const area = `${line} L ${pts[pts.length - 1][0].toFixed(1)} ${H - padB} L ${pts[0][0].toFixed(1)} ${H - padB} Z`;

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    const relX = ((e.clientX - rect.left) / rect.width) * W;
    let best = 0;
    let bd = Infinity;
    pts.forEach((p, i) => {
      const d = Math.abs(p[0] - relX);
      if (d < bd) {
        bd = d;
        best = i;
      }
    });
    setTip({ i: best, left: (pts[best][0] / W) * rect.width, top: (pts[best][1] / H) * rect.height });
  };

  const gridLines = 4;
  return (
    <div ref={wrapRef} style={{ position: "relative" }} onMouseMove={onMove} onMouseLeave={() => setTip(null)}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block" }} role="img" aria-label="Revenue trend, last 12 months">
        <defs>
          <linearGradient id="adTrendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F26323" stopOpacity=".28" />
            <stop offset="100%" stopColor="#F26323" stopOpacity="0" />
          </linearGradient>
        </defs>
        {Array.from({ length: gridLines + 1 }, (_, i) => {
          const gy = padT + (i / gridLines) * (H - padT - padB);
          const val = max * (1 - i / gridLines);
          return (
            <g key={i}>
              <line x1={padL} x2={W - padR} y1={gy} y2={gy} stroke="currentColor" opacity=".09" strokeWidth="1" />
              <text x={padL - 8} y={gy + 4} textAnchor="end" fontSize="10.5" fontFamily="JetBrains Mono, monospace" fill="currentColor" opacity=".5">
                {formatMoneyShort(val)}
              </text>
            </g>
          );
        })}
        {data.map((d, i) => (
          <text key={d.month} x={x(i)} y={H - 8} textAnchor="middle" fontSize="10.5" fontFamily="JetBrains Mono, monospace" fill="currentColor" opacity=".5">
            {monthLabel(d.month)}
          </text>
        ))}
        <path d={area} fill="url(#adTrendFill)" />
        <path d={line} fill="none" stroke="#F26323" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {tip && (
          <g>
            <line x1={pts[tip.i][0]} x2={pts[tip.i][0]} y1={padT} y2={H - padB} stroke="currentColor" opacity=".2" strokeDasharray="3 3" />
            <circle cx={pts[tip.i][0]} cy={pts[tip.i][1]} r="4.5" fill="#F26323" stroke="#fff" strokeWidth="2" />
          </g>
        )}
      </svg>
      {tip && (
        <div className="chart-tip" style={{ left: tip.left, top: tip.top }}>
          {monthLabel(data[tip.i].month)} · <b>{formatMoney(data[tip.i].revenue)}</b>
        </div>
      )}
    </div>
  );
}
