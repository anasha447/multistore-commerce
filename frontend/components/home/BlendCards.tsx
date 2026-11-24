"use client";

// "Our Blends" — faithful port of Matessa Landing v4 §Three Blends One Leaf,
// wired to the live catalog. Left-aligned heading; tinted cards (radius 22px) with
// a 320px pouch stage; the leaf-pattern overlay tints + pans in on hover; the pouch
// straightens and lifts; the full-width pill "Explore Blend" slides up and opens the
// product page (choosing a size happens there). No prices on the cards (per the design). Mobile: 80% scroll-snap
// carousel with edge bleed; the centered card counts as hovered.

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Reveal } from "@/components/Reveal";

function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 840px)");
    const on = () => setMobile(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return mobile;
}

export interface BlendCardData {
  name: string;
  slug: string;
  price: number;
  image: string;
  /** Default variant (no longer used by the card, which links to the product page). */
  variantId: number | null;
}

interface Skin {
  bg: string;
  overlay: string;
  label: string;
  labelColor: string;
  restRotate: string;
}

// Per-slug visual config verbatim from the design; neutral fallback for future products.
const SKINS: Record<string, Skin> = {
  "masala-mate": { bg: "#F7E3CF", overlay: "#F26323", label: "Cinnamon · Cardamom · Clove", labelColor: "#C2500F", restRotate: "-2.5deg" },
  "lemon-ginger-mate": { bg: "#F9EDC6", overlay: "#F3CB57", label: "Lemon Peel · Ginger Root", labelColor: "#A58114", restRotate: "1.5deg" },
  "raw-mate": { bg: "#EFE7CD", overlay: "#EADBA2", label: "Pure Loose Leaf", labelColor: "#8F7A33", restRotate: "-1.5deg" },
};
const FALLBACK_SKIN: Skin = { bg: "#EFE7CD", overlay: "#EADBA2", label: "Small-Batch Blend", labelColor: "#8F7A33", restRotate: "-1.5deg" };

export function BlendCards({ blends }: { blends: BlendCardData[] }) {
  const [hovered, setHovered] = useState(-1);
  const scroller = useRef<HTMLDivElement>(null);
  const [centered, setCentered] = useState(0);
  const isMobile = useIsMobile();

  const onScroll = () => {
    const s = scroller.current;
    if (!s) return;
    const c = s.scrollLeft + s.clientWidth / 2;
    let best = 0;
    let bd = Number.POSITIVE_INFINITY;
    Array.from(s.children).forEach((k, i) => {
      const el = k as HTMLElement;
      const d = Math.abs(el.offsetLeft + el.offsetWidth / 2 - c);
      if (d < bd) {
        bd = d;
        best = i;
      }
    });
    setCentered(best);
  };

  return (
    <section id="shop" aria-label="Three Blends One Leaf" style={{ background: "#F9F7F3", padding: "clamp(56px, 7vw, 96px) clamp(20px, 4vw, 48px)" }}>
      <div style={{ maxWidth: 1360, margin: "0 auto", display: "flex", flexDirection: "column", gap: "clamp(36px, 4.5vw, 52px)" }}>
        <Reveal>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 18 }}>
            <h2 className="font-heading" style={{ margin: 0, fontWeight: 700, fontSize: "clamp(32px, 3.8vw, 50px)", letterSpacing: "-0.01em", color: "#2F3B28" }}>
              Our Blends
            </h2>
          </div>
        </Reveal>

        <div
          ref={scroller}
          onScroll={onScroll}
          className="flex snap-x snap-mandatory overflow-x-auto [-webkit-overflow-scrolling:touch] [scrollbar-width:none] nav:grid nav:snap-none nav:overflow-visible nav:[grid-template-columns:repeat(auto-fit,minmax(290px,1fr))]"
          style={
            isMobile
              ? { gap: 14, margin: "0 calc(-1 * clamp(20px, 4vw, 48px))", padding: "4px 11% 20px" }
              : { gap: "clamp(16px, 2vw, 28px)" }
          }
        >
          {blends.map((b, i) => {
            const skin = SKINS[b.slug] ?? FALLBACK_SKIN;
            // Desktop: reveal only on real hover. Mobile: the centered carousel card
            // is "active". Keeping them separate stops the first card from showing its
            // background at rest on desktop (centered defaults to 0).
            const hot = isMobile ? centered === i : hovered === i;
            return (
              <Reveal key={b.slug} delay={i * 110} className="min-w-0 flex-[0_0_80%] snap-center nav:flex-none">
                <div
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(-1)}
                  style={{
                    position: "relative",
                    overflow: "hidden",
                    background: skin.bg,
                    borderRadius: 22,
                    padding: "clamp(24px, 2.6vw, 36px)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    gap: 14,
                    height: "100%",
                  }}
                >
                  {/* pattern overlay across the pouch stage */}
                  <div
                    aria-hidden="true"
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      height: `calc(clamp(24px, 2.6vw, 36px) + ${isMobile ? 356 : 388}px)`,
                      backgroundImage: "url('/brand/leaf-pattern-light.webp')",
                      backgroundSize: "320px",
                      backgroundColor: skin.overlay,
                      backgroundBlendMode: "multiply",
                      animation: "mtsa-pan 22s linear infinite",
                      opacity: hot ? 0.85 : 0,
                      transition: "opacity 0.65s ease",
                    }}
                  />
                  {/* pouch stage */}
                  <Link
                    href={`/product/${b.slug}`}
                    aria-label={b.name}
                    style={{ alignSelf: "stretch", position: "relative", height: isMobile ? 356 : 388, display: "flex", alignItems: "flex-end", justifyContent: "center", padding: "0 0 8px" }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={b.image}
                      alt={`${b.name} pouch`}
                      draggable={false}
                      style={{
                        position: "relative",
                        height: "100%",
                        width: "auto",
                        transform: hot ? "rotate(0deg) translateY(-8px)" : `rotate(${skin.restRotate})`,
                        transition: "transform 0.6s cubic-bezier(0.22, 0.68, 0.2, 1)",
                        filter: "drop-shadow(0 16px 22px rgba(24,32,16,0.22))",
                      }}
                    />
                  </Link>
                  <div style={{ position: "relative", fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: skin.labelColor }}>
                    {skin.label}
                  </div>
                  <div style={{ position: "relative", alignSelf: "stretch", display: "flex", flexWrap: "wrap", alignItems: "baseline", justifyContent: "space-between", gap: "6px 16px" }}>
                    <h3 className="font-heading" style={{ margin: 0, fontWeight: 700, fontSize: 26, color: "#2F3B28" }}>
                      <Link href={`/product/${b.slug}`}>{b.name}</Link>
                    </h3>
                  </div>
                  <Link
                    href={`/product/${b.slug}`}
                    onFocus={() => setHovered(i)}
                    onBlur={() => setHovered(-1)}
                    // Brand orange (--color-orange) with its hover shade. As classes, not an
                    // inline background, so the hover state is not overridden.
                    className="bg-orange hover:bg-orange-hover"
                    style={{
                      position: "relative",
                      alignSelf: "stretch",
                      marginTop: 4,
                      transform: hot ? "translateY(0px)" : "translateY(14px)",
                      opacity: hot ? 1 : 0,
                      color: "#FFFFFF",
                      padding: "13px 28px",
                      borderRadius: 999,
                      border: "1px solid var(--color-orange)",
                      fontFamily: "var(--font-body)",
                      fontWeight: 700,
                      fontSize: 14,
                      textAlign: "center",
                      textDecoration: "none",
                      transition: "transform 0.45s cubic-bezier(0.22, 0.68, 0.2, 1), opacity 0.35s ease, background 0.3s ease",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Explore Blend
                  </Link>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
