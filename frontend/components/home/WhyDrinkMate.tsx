"use client";

// "Why Drink Mate?" — Matessa Landing v4 §Why Drink Mate, refined.
//
// Same six reasons, copy, palette and sticky-scroll mechanics as the design: a tall wrapper
// (100 + 6×55 svh) with a sticky full-viewport inner, scroll progress picking the active
// reason. The refinement gives the walk a shape:
//
//  - A stem runs down beside the titles and grows continuously with scroll; a pair of leaves
//    unfurls on the stem as each reason is reached. (Progress is written to the DOM directly,
//    so scrolling never re-renders React — only a change of reason does.)
//  - The copy is revealed by a short bottom-up wipe; the stat's rule draws in after it.
//  - A faint leaf texture sits behind the panel only (BRAND §5: one pattern surface).
//  - Titles are buttons that scroll to their reason (keyboard path; aria-current="step").
//  - Phones swap the title list for the active title, a "03 / 06" counter and a dot stem
//    whose dots sprout the same leaf pair as they are reached.
//  - Reduced motion → the static stacked list, no growth, no wipes.

import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";

const PER_SVH = 55;
const INK = "#2F3B28";
const GREEN = "#3E5F2D";
const BODY = "#4A5545";
const PAGE = "#F9F7F3";
const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

interface Benefit {
  title: string;
  copy: string;
  stat: string;
  icon: ReactNode;
}

const S = { width: 30, height: 30, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

const BENEFITS: Benefit[] = [
  {
    title: "Natural Energy",
    copy: "A balanced source of natural caffeine that raises alertness and physical endurance — smooth, steady energy with no spike and no crash.",
    stat: "≈85 mg natural caffeine · steady for hours",
    icon: (
      <svg {...S}>
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
  },
  {
    title: "Boosts Heart Health",
    copy: "Rich in polyphenols and saponins that may improve cholesterol levels and help protect against heart disease with regular drinking.",
    stat: "Supports healthy cholesterol levels",
    icon: (
      <svg {...S}>
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
      </svg>
    ),
  },
  {
    title: "Enhances Focus",
    copy: "Caffeine works alongside theobromine for calm, clear-headed concentration — sharp focus without the jitters of coffee.",
    stat: "Caffeine + theobromine, in balance",
    icon: (
      <svg {...S}>
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
      </svg>
    ),
  },
  {
    title: "Rich in Antioxidants",
    copy: "Packed with antioxidants, vitamins and minerals that defend your cells and keep your body healthy and strong.",
    stat: "More antioxidants than green tea",
    icon: (
      <svg {...S}>
        <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
      </svg>
    ),
  },
  {
    title: "Supports Hydration",
    copy: "Sipped slowly, leaf after leaf, mate keeps you refreshed and counts toward your daily fluid intake alongside its nutrients.",
    stat: "Counts toward daily hydration",
    icon: (
      <svg {...S}>
        <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" />
      </svg>
    ),
  },
  {
    title: "Aids Digestion",
    copy: "Traditionally shared after meals across South America, mate gently stimulates digestion and helps keep your metabolism in balance.",
    stat: "A post-meal ritual for centuries",
    icon: (
      <svg {...S}>
        <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
        <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
        <path d="M7 21h10M12 3v18" />
      </svg>
    ),
  },
];

const N = BENEFITS.length;

/** Subscribes to a media query without setting state inside an effect. */
function useMedia(query: string, serverValue: boolean) {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    [query],
  );
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, () => serverValue);
}

/** Two leaves on a node of the stem; they unfurl when the reason is reached. */
function LeafNode({ reached, active, scale = 1 }: { reached: boolean; active: boolean; scale?: number }) {
  return (
    <span
      aria-hidden="true"
      style={{
        position: "absolute",
        left: 0,
        top: "50%",
        width: 0,
        height: 0,
      }}
    >
      <span
        style={{
          position: "absolute",
          left: -5,
          top: -5,
          width: 10,
          height: 10,
          borderRadius: "50%",
          background: reached ? GREEN : PAGE,
          boxShadow: `0 0 0 1.5px ${reached ? GREEN : "rgba(47,59,40,0.22)"}`,
          transition: `background 0.4s ${EASE}, box-shadow 0.4s ${EASE}`,
        }}
      />
      <svg
        width="34"
        height="26"
        viewBox="0 0 34 26"
        style={{
          position: "absolute",
          left: -17,
          top: -24,
          overflow: "visible",
          transformOrigin: "17px 24px",
          transform: reached ? `scale(${(active ? 1 : 0.86) * scale})` : "scale(0) rotate(-30deg)",
          opacity: reached ? 1 : 0,
          transition: `transform 0.7s ${EASE}, opacity 0.35s ease`,
        }}
      >
        {/* left leaf */}
        <path d="M17 24 C 12 20, 3 19, 1 9 C 9 9, 15 14, 17 24 Z" fill={GREEN} opacity="0.92" />
        <path d="M17 24 C 13 19, 8 14, 3 11" stroke={PAGE} strokeWidth="0.9" fill="none" opacity="0.7" />
        {/* right leaf */}
        <path d="M17 24 C 21 19, 30 16, 33 5 C 25 6, 18 12, 17 24 Z" fill="#5E8A3E" />
        <path d="M17 24 C 21 17, 26 11, 31 7" stroke={PAGE} strokeWidth="0.9" fill="none" opacity="0.7" />
      </svg>
    </span>
  );
}

export function WhyDrinkMate() {
  const wrap = useRef<HTMLElement>(null);
  const list = useRef<HTMLOListElement>(null);
  const stemFill = useRef<HTMLSpanElement>(null);
  const dotFill = useRef<HTMLSpanElement>(null);
  const texture = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const reduced = useMedia("(prefers-reduced-motion: reduce)", false);
  const phone = useMedia("(max-width: 719px)", false);

  useEffect(() => {
    if (reduced) return;
    let ticking = false;

    const update = () => {
      ticking = false;
      const el = wrap.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const total = r.height - window.innerHeight;
      const p = total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 1;
      const idx = Math.min(N - 1, Math.max(0, Math.floor(p * N)));
      setActive(idx); // React bails out when the reason hasn't changed

      // Continuous position along the reasons: 0 at the first title's centre, N-1 at the last.
      const along = Math.min(N - 1, Math.max(0, p * N - 0.5));

      const ol = list.current;
      const fill = stemFill.current;
      if (ol && fill) {
        const items = Array.from(ol.children) as HTMLElement[];
        if (items.length === N) {
          const centre = (i: number) => items[i].offsetTop + items[i].offsetHeight / 2;
          const i0 = Math.floor(along);
          const i1 = Math.min(N - 1, i0 + 1);
          const y = centre(i0) + (centre(i1) - centre(i0)) * (along - i0);
          const track = centre(N - 1);
          fill.style.transform = `scaleY(${track > 0 ? y / track : 0})`;
        }
      }
      if (dotFill.current) dotFill.current.style.transform = `scaleX(${along / (N - 1)})`;
      if (texture.current) texture.current.style.transform = `translate3d(0, ${(-p * 36).toFixed(1)}px, 0)`;
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [reduced, phone]);

  /** Scrolls so reason i is the active one (middle of its slice of the scroll range). */
  const goTo = (i: number) => {
    const el = wrap.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    const total = el.offsetHeight - window.innerHeight;
    window.scrollTo({ top: top + ((i + 0.5) / N) * total, behavior: "smooth" });
  };

  const heading = (
    <h2
      id="benefits-heading"
      className="font-heading"
      style={{ margin: 0, fontWeight: 700, fontSize: "clamp(30px, 3.4vw, 40px)", color: INK, textAlign: "center", textWrap: "balance" }}
    >
      Why Drink Mate?
    </h2>
  );

  if (reduced) {
    return (
      <section id="benefits" aria-labelledby="benefits-heading" style={{ background: PAGE, padding: "clamp(48px, 7vw, 90px) clamp(20px, 4vw, 32px)" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", display: "flex", flexDirection: "column", gap: 36 }}>
          {heading}
          <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 34 }}>
            {BENEFITS.map((b) => (
              <li key={b.title} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <h3 className="font-heading" style={{ margin: 0, fontWeight: 700, fontSize: "clamp(21px, 2.4vw, 30px)", lineHeight: 1.2, color: GREEN }}>
                  {b.title}
                </h3>
                <Panel benefit={b} shown />
              </li>
            ))}
          </ol>
        </div>
      </section>
    );
  }

  return (
    <section
      id="benefits"
      ref={wrap}
      aria-labelledby="benefits-heading"
      style={{ position: "relative", background: PAGE, height: `${100 + N * PER_SVH}svh` }}
    >
      <div
        style={{
          position: "sticky",
          top: 0,
          minHeight: "100svh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: phone ? 26 : "clamp(30px, 5vh, 58px)",
          maxWidth: 1120,
          margin: "0 auto",
          padding: "clamp(20px, 3vh, 48px) clamp(20px, 4vw, 32px)",
          overflow: "hidden",
        }}
      >
        {heading}

        <div
          style={{
            display: "flex",
            flexDirection: phone ? "column" : "row",
            alignItems: phone ? "stretch" : "center",
            gap: phone ? 22 : "clamp(36px, 6vw, 96px)",
          }}
        >
          {/* ── Reasons: the stem on wide screens, counter + dot stem on phones ── */}
          {phone ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
                <h3
                  key={active}
                  className="font-heading"
                  aria-live="polite"
                  style={{
                    margin: 0,
                    fontWeight: 700,
                    fontSize: 26,
                    lineHeight: 1.15,
                    color: GREEN,
                    animation: `mtsa-wdm-wipe 0.6s ${EASE} both`,
                  }}
                >
                  {BENEFITS[active].title}
                </h3>
                <span
                  className="font-body"
                  style={{ flex: "none", fontSize: 13, fontWeight: 700, letterSpacing: "0.08em", color: "rgba(47,59,40,0.62)", fontVariantNumeric: "tabular-nums" }}
                >
                  {String(active + 1).padStart(2, "0")} / {String(N).padStart(2, "0")}
                </span>
              </div>
              {/* Dot stem: the same leaf pair as the desktop stem unfurls from each dot as it is
                  reached (room above the track for the leaves). */}
              <div
                aria-hidden="true"
                style={{ position: "relative", height: 10, marginTop: 20, marginInline: 6, display: "flex", alignItems: "center", justifyContent: "space-between" }}
              >
                <span style={{ position: "absolute", left: 4, right: 4, top: 4, height: 2, borderRadius: 2, background: "rgba(47,59,40,0.14)" }} />
                <span
                  ref={dotFill}
                  style={{ position: "absolute", left: 4, right: 4, top: 4, height: 2, borderRadius: 2, background: GREEN, transformOrigin: "left center", transform: "scaleX(0)" }}
                />
                {BENEFITS.map((b, i) => (
                  <span key={b.title} style={{ position: "relative", width: 10, height: 10 }}>
                    <span style={{ position: "absolute", left: 5, top: 5 }}>
                      <LeafNode reached={i <= active} active={i === active} scale={0.78} />
                    </span>
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ flex: "1 1 0", minWidth: 0, position: "relative", paddingLeft: 40 }}>
              {/* stem: faint track + growing fill, both centred on the leaf nodes */}
              <span aria-hidden="true" style={{ position: "absolute", left: 13, top: 0, bottom: 0, width: 2, borderRadius: 2, background: "rgba(47,59,40,0.10)" }} />
              <span
                ref={stemFill}
                aria-hidden="true"
                style={{
                  position: "absolute",
                  left: 13,
                  top: 0,
                  bottom: 0,
                  width: 2,
                  borderRadius: 2,
                  background: `linear-gradient(${GREEN}, #5E8A3E)`,
                  transformOrigin: "top center",
                  transform: "scaleY(0)",
                }}
              />
              <ol ref={list} style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "clamp(8px, 1.8vh, 20px)" }}>
                {BENEFITS.map((b, i) => {
                  const reached = i <= active;
                  const on = i === active;
                  return (
                    <li key={b.title} style={{ position: "relative" }}>
                      <span style={{ position: "absolute", left: -26, top: 0, bottom: 0 }}>
                        <LeafNode reached={reached} active={on} />
                      </span>
                      <h3 className="font-heading" style={{ margin: 0 }}>
                        <button
                          type="button"
                          onClick={() => goTo(i)}
                          aria-current={on ? "step" : undefined}
                          className="mtsa-wdm-title"
                          style={{
                            display: "block",
                            width: "100%",
                            padding: "4px 0",
                            border: "none",
                            background: "none",
                            textAlign: "left",
                            cursor: "pointer",
                            font: "inherit",
                            fontWeight: 700,
                            fontSize: "clamp(21px, 2.4vw, 33px)",
                            lineHeight: 1.2,
                            color: on ? GREEN : "rgba(47,59,40,0.34)",
                            opacity: reached ? 1 : 0.0,
                            transform: reached ? (on ? "translateX(8px)" : "none") : "translateY(18px)",
                            transition: `color 0.4s ease, opacity 0.6s ease, transform 0.7s ${EASE}`,
                          }}
                        >
                          {b.title}
                        </button>
                      </h3>
                    </li>
                  );
                })}
              </ol>
            </div>
          )}

          {/* ── Panel: copy wipes in over a faint leaf texture ── */}
          <div
            style={{
              flex: phone ? "none" : "1 1 0",
              minWidth: 0,
              position: "relative",
              minHeight: phone ? 250 : "clamp(260px, 38vh, 340px)",
            }}
          >
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                inset: phone ? "-12px -20px" : "-40px -48px",
                overflow: "hidden",
                pointerEvents: "none",
                WebkitMaskImage: "radial-gradient(ellipse 70% 65% at 55% 50%, #000 0%, transparent 75%)",
                maskImage: "radial-gradient(ellipse 70% 65% at 55% 50%, #000 0%, transparent 75%)",
              }}
            >
              <div
                ref={texture}
                style={{
                  position: "absolute",
                  inset: "-40px 0",
                  backgroundImage: "url(/brand/leaf-pattern-light.webp)",
                  backgroundSize: "cover",
                  backgroundPosition: "center 18%",
                  opacity: 0.16,
                  willChange: "transform",
                }}
              />
            </div>
            {BENEFITS.map((b, i) => (
              <div
                key={b.title}
                aria-hidden={i !== active}
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  gap: "clamp(14px, 2.4vh, 22px)",
                  pointerEvents: i === active ? "auto" : "none",
                  visibility: i === active ? "visible" : "hidden",
                  transition: i === active ? "visibility 0s" : "visibility 0s 0.3s",
                }}
              >
                <Panel benefit={b} shown={i === active} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Panel({ benefit, shown }: { benefit: Benefit; shown: boolean }) {
  // Entrance: bottom-up wipe (clip-path) with a short rise; exit is a quicker fade.
  const reveal = (delay: number): React.CSSProperties => ({
    clipPath: shown ? "inset(-8% -4% -8% -4%)" : "inset(100% -4% -8% -4%)",
    transform: shown ? "none" : "translateY(14px)",
    opacity: shown ? 1 : 0,
    transition: shown
      ? `clip-path 0.7s ${EASE} ${delay}s, transform 0.7s ${EASE} ${delay}s, opacity 0.3s ease ${delay}s`
      : "clip-path 0.3s ease, transform 0.3s ease, opacity 0.25s ease",
  });

  return (
    <>
      <div style={{ display: "flex", flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", gap: "clamp(16px, 2.4vw, 26px)" }}>
        <div
          style={{
            flex: "none",
            width: "clamp(56px, 6vw, 72px)",
            height: "clamp(56px, 6vw, 72px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "50%",
            background: INK,
            color: "#EADBA2",
            boxShadow: "0 12px 26px rgba(47,59,40,0.22)",
            transform: shown ? "scale(1) rotate(0deg)" : "scale(0.7) rotate(-25deg)",
            opacity: shown ? 1 : 0,
            transition: shown
              ? `transform 0.75s ${EASE} 0.08s, opacity 0.35s ease 0.08s`
              : "transform 0.25s ease, opacity 0.2s ease",
          }}
        >
          {benefit.icon}
        </div>
        <p style={{ margin: 0, maxWidth: "46ch", fontSize: "clamp(15px, 1.4vw, 18px)", fontWeight: 500, lineHeight: 1.7, color: BODY, ...reveal(0) }}>
          {benefit.copy}
        </p>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          fontSize: 12.5,
          fontWeight: 700,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: GREEN,
          ...reveal(0.14),
        }}
      >
        <span
          style={{
            width: 26,
            height: 2,
            borderRadius: 2,
            background: "currentColor",
            flex: "none",
            transformOrigin: "left center",
            transform: shown ? "scaleX(1)" : "scaleX(0)",
            transition: shown ? `transform 0.6s ${EASE} 0.3s` : "transform 0.2s ease",
          }}
        />
        <span>{benefit.stat}</span>
      </div>
    </>
  );
}
