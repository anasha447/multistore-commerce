"use client";

// "Yerba Mate Consumption Map" (design: src/world-map.jsx) rebuilt with d3-geo +
// topojson-client (no react-simple-maps — React 19 peer). Countries are tinted by a
// consumption value; India is highlighted orange. Hover (desktop) / tap (mobile)
// shows a flag + story tooltip.

import { useMemo, useState } from "react";
import { geoNaturalEarth1, geoPath } from "d3-geo";
import { scaleLinear } from "d3-scale";
import { feature } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import type { FeatureCollection, Geometry } from "geojson";
import world from "@/lib/data/countries-110m.json";

interface CountryProps {
  name: string;
}

const COUNTRY_DATA: Record<string, { value: number; story: string; color?: string }> = {
  ARG: { value: 199, story: "Mate is the national drink of Argentina." },
  BRA: { value: 120, story: "Brazil enjoys chimarrão." },
  URY: { value: 190, story: "Uruguay has one of the highest per-capita consumptions." },
  PRY: { value: 160, story: "Paraguay drinks tereré in summer." },
  SYR: { value: 150, story: "Imported by immigrant communities, now part of Syrian tea culture." },
  BOL: { value: 180, story: "Bolivia drinks mate for both culture and health." },
  CHL: { value: 150, story: "Chile has a strong mate culture." },
  USA: { value: 30, story: "Mate is trendy in US wellness circles." },
  ESP: { value: 60, story: "Spain is the largest importer in Europe." },
  ITA: { value: 30, story: "Mate is imported for health-conscious consumers." },
  DEU: { value: 50, story: "Germany has a growing interest in mate." },
  ARE: { value: 40, story: "The UAE enjoys mate as a trendy beverage." },
  COL: { value: 60, story: "Colombia has a small but growing mate market." },
  LBN: { value: 100, story: "Lebanon has a unique blend of mate with local herbs." },
  GBR: { value: 25, story: "In the UK, mate is niche but growing among herbal-tea enthusiasts." },
  IND: {
    value: 15,
    story: "India is discovering yerba mate — the magic of spices as a healthy alternative to tea and coffee.",
    color: "#F26323",
  },
};

const ID_TO_ISO: Record<string, string> = {
  "032": "ARG", "068": "BOL", "076": "BRA", "152": "CHL", "600": "PRY",
  "760": "SYR", "858": "URY", "840": "USA", "724": "ESP", "380": "ITA",
  "276": "DEU", "784": "ARE", "170": "COL", "422": "LBN", "356": "IND", "826": "GBR",
};
const ISO_TO_2: Record<string, string> = {
  ARG: "ar", BRA: "br", URY: "uy", PRY: "py", SYR: "sy", BOL: "bo", CHL: "cl", USA: "us",
  ESP: "es", ITA: "it", DEU: "de", ARE: "ae", COL: "co", LBN: "lb", IND: "in", GBR: "gb",
};

const WIDTH = 980;
const HEIGHT = 520;

export function WorldConsumptionMap() {
  const [tip, setTip] = useState<{ name: string; story: string | null; flag: string | null; x: number; y: number } | null>(null);

  const { features, path } = useMemo(() => {
    const topo = world as unknown as Topology<{ countries: GeometryCollection<CountryProps> }>;
    const fc = feature(topo, topo.objects.countries) as FeatureCollection<Geometry, CountryProps>;
    const projection = geoNaturalEarth1().fitSize([WIDTH, HEIGHT], fc);
    return { features: fc.features, path: geoPath(projection) };
  }, []);

  const scale = useMemo(() => scaleLinear<string>().domain([0, 200]).range(["#7A9D3E", "#2F3B28"]), []);

  const fillFor = (id: string | number | undefined): string => {
    const iso = ID_TO_ISO[String(id)];
    const data = iso ? COUNTRY_DATA[iso] : undefined;
    if (data?.color) return data.color;
    return data ? scale(data.value) : "#F3EAD0";
  };

  return (
    <section className="relative w-full overflow-hidden bg-white py-8">
      <div className="relative mx-auto max-w-6xl px-4">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="h-auto w-full" role="img" aria-label="World map shaded by yerba mate consumption">
          {features.map((f, i) => {
            const iso = ID_TO_ISO[String(f.id)];
            const data = iso ? COUNTRY_DATA[iso] : undefined;
            return (
              <path
                key={i}
                d={path(f) ?? undefined}
                fill={fillFor(f.id)}
                stroke="#FFFFFF"
                strokeWidth={0.5}
                className="cursor-pointer transition-[fill] duration-300 hover:fill-craemy"
                onMouseEnter={(e) =>
                  setTip({
                    name: f.properties.name,
                    story: data?.story ?? null,
                    flag: iso ? `https://flagcdn.com/w40/${ISO_TO_2[iso]}.webp` : null,
                    x: e.clientX,
                    y: e.clientY,
                  })
                }
                onMouseMove={(e) => setTip((p) => (p ? { ...p, x: e.clientX, y: e.clientY } : p))}
                onMouseLeave={() => setTip(null)}
                onClick={(e) =>
                  setTip({
                    name: f.properties.name,
                    story: data?.story ?? null,
                    flag: iso ? `https://flagcdn.com/w40/${ISO_TO_2[iso]}.webp` : null,
                    x: e.clientX,
                    y: e.clientY,
                  })
                }
              />
            );
          })}
        </svg>
      </div>

      {tip && (
        <div
          className="pointer-events-none fixed z-50 max-w-[280px] rounded-lg border border-gray-200 bg-white p-3 shadow-xl"
          style={{ left: Math.min(tip.x + 14, WIDTH), top: tip.y + 14 }}
        >
          <div className="mb-1 flex items-center gap-2">
            {tip.flag && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={tip.flag} alt="" className="h-4 w-6 rounded-sm object-cover shadow-sm" />
            )}
            <strong className="font-body text-sm font-bold text-darkgreen">{tip.name}</strong>
          </div>
          {tip.story && <p className="font-body text-[13px] leading-snug text-gray-600">{tip.story}</p>}
        </div>
      )}
    </section>
  );
}
