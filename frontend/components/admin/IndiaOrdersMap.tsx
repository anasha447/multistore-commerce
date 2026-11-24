"use client";

// Orders-per-state choropleth for the admin dashboard (DESIGN-SYSTEM.md §8).
// Map data: frontend/lib/data/india-states.topo.json — states layer derived from
// udit-001/india-maps-data (github.com/udit-001/india-maps-data, MIT), pruned to
// the 36 states/UTs. State names (`st_nm`) match lib/constants/indianStates.ts
// exactly, which is also what checkout writes — so the join is by plain name.

import { useMemo, useState } from "react";
import { geoMercator, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import type { FeatureCollection, Geometry } from "geojson";
import topology from "@/lib/data/india-states.topo.json";
import type { StateOrderCount } from "@/lib/api";

interface StateProps {
  st_nm: string;
  st_code: string;
}

const WIDTH = 620;
const HEIGHT = 660;

// White → brand green ramp; zero-order states stay outline-only.
const RAMP = ["#EDF3E7", "#CBDCB9", "#A3C287", "#7A9D3E", "#3E5F2D"];

function tint(count: number, max: number): string {
  if (count <= 0 || max <= 0) return "#FFFFFF";
  const idx = Math.min(RAMP.length - 1, Math.floor((count / max) * RAMP.length));
  return RAMP[idx];
}

export function IndiaOrdersMap({ data }: { data: StateOrderCount[] }) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [pinned, setPinned] = useState<string | null>(null);

  const { features, path } = useMemo(() => {
    const topo = topology as unknown as Topology<{ states: GeometryCollection<StateProps> }>;
    const fc = feature(topo, topo.objects.states) as FeatureCollection<Geometry, StateProps>;
    const projection = geoMercator().fitSize([WIDTH, HEIGHT], fc);
    return { features: fc.features, path: geoPath(projection) };
  }, []);

  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const row of data) m.set(row.state, row.orderCount);
    return m;
  }, [data]);

  const max = useMemo(() => Math.max(0, ...data.map((d) => d.orderCount)), [data]);
  const mapped = useMemo(() => new Set(features.map((f) => f.properties.st_nm)), [features]);
  const unmatched = data.filter((d) => !mapped.has(d.state));
  const total = data.reduce((s, d) => s + d.orderCount, 0);

  const active = pinned ?? hovered;

  return (
    <div className="india-map">
      <div className="india-map-canvas">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          role="img"
          aria-label="Map of India shaded by orders per state"
        >
          {features.map((f) => {
            const name = f.properties.st_nm;
            const count = counts.get(name) ?? 0;
            const isActive = active === name;
            return (
              <path
                key={name}
                d={path(f) ?? undefined}
                className={`india-state${isActive ? " is-active" : ""}`}
                fill={tint(count, max)}
                tabIndex={0}
                aria-label={`${name}: ${count} order${count === 1 ? "" : "s"}`}
                onMouseEnter={() => setHovered(name)}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => setHovered(name)}
                onBlur={() => setHovered(null)}
                onClick={() => setPinned((p) => (p === name ? null : name))}
              />
            );
          })}
        </svg>
      </div>

      <div className="india-map-side">
        <div className="india-map-total">
          <b>{total.toLocaleString("en-IN")}</b>
          <span>orders across {data.length} region{data.length === 1 ? "" : "s"}</span>
        </div>
        <div className="stat-rows">
          {[...data]
            .sort((a, b) => b.orderCount - a.orderCount)
            .slice(0, 8)
            .map((row, i) => (
              <button
                type="button"
                className={`stat-row india-map-row${active === row.state ? " is-active" : ""}`}
                key={row.state}
                onClick={() => setPinned((p) => (p === row.state ? null : row.state))}
              >
                <span className="rank">{String(i + 1).padStart(2, "0")}</span>
                <span className="lbl">{row.state}</span>
                <span className="val">{row.orderCount}</span>
              </button>
            ))}
          {data.length === 0 && (
            <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>No orders yet.</p>
          )}
        </div>
        {unmatched.length > 0 && (
          <p className="india-map-note">
            Not on the map: {unmatched.map((u) => `${u.state} (${u.orderCount})`).join(", ")}
          </p>
        )}
      </div>
    </div>
  );
}
