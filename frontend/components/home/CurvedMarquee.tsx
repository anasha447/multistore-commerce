"use client";

// Curved marquee band — faithful port of Matessa Landing v4 §Marquee.
// Cream Quicksand caps travel left→right along a curved <textPath>; the text is
// repeated to cover pathLength + one text-length, and startOffset animates from
// -L to 0 (speed 40 px/s), exactly like the design runtime. The desktop and mobile
// curves are the design's own geometry. Reduced motion → static text on the curve.

import { useEffect, useRef } from "react";

const UNIT =
  "NATURALLY CAFFEINATED  ·  HAND-BLENDED IN SMALL BATCHES  ·  SINGLE-ORIGIN LEAF  ·  BREWED HOT OR ICED  ·  ";

export function CurvedMarquee() {
  const host = useRef<HTMLElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // Park a single repetition mid-path so the band still reads.
      host.current?.querySelectorAll<SVGTextPathElement>("[data-mq-tp]").forEach((tp) => {
        tp.textContent = UNIT.repeat(3);
        tp.setAttribute("startOffset", "0");
      });
      return;
    }
    const tps = Array.from(host.current?.querySelectorAll<SVGTextPathElement>("[data-mq-tp]") ?? []);
    const items = tps.map((tp) => {
      tp.textContent = UNIT;
      let L = 0;
      try {
        L = tp.getComputedTextLength();
      } catch {
        // jsdom / non-rendered — fall through to the default
      }
      if (!L || !Number.isFinite(L)) L = 900;
      const ref = (tp.getAttribute("href") || "#mtsa-mq-path").slice(1);
      const path = document.getElementById(ref) as unknown as SVGPathElement | null;
      const pathLen = path?.getTotalLength() ?? 1500;
      tp.textContent = UNIT.repeat(Math.max(2, Math.ceil((pathLen + L) / L)));
      return { tp, L };
    });
    const speed = 40;
    const t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      for (const it of items) {
        it.tp.setAttribute("startOffset", String(((((now - t0) / 1000) * speed) % it.L) - it.L));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <section
      ref={host}
      aria-hidden="true"
      className="-mt-[72px] nav:-mt-px"
      style={{ position: "relative", zIndex: 10 }}
    >
      {/* Desktop curve (hidden ≤840px via CSS class) */}
      <div className="hidden nav:block">
        <svg viewBox="0 0 1440 130" style={{ display: "block", width: "100%", height: "auto" }}>
          <path d="M0,78 C420,124 980,110 1440,62 L1440,131 L0,131 Z" fill="#F9F7F3" />
          <path d="M0,30 C420,76 980,62 1440,14 L1440,62 C980,110 420,124 0,78 Z" fill="#2F3B28" />
          <path d="M0,30 C420,76 980,62 1440,14" fill="none" stroke="#F3CB57" strokeWidth="2.5" />
          <path id="mtsa-mq-path" d="M0,54 C420,100 980,86 1440,38" fill="none" />
          <text
            dominantBaseline="middle"
            style={{ fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 700, letterSpacing: "3.4px", fill: "#EADBA2" }}
          >
            <textPath data-mq-tp href="#mtsa-mq-path" startOffset="0">
              {UNIT}
            </textPath>
          </text>
        </svg>
      </div>
      {/* Mobile curve */}
      <div className="nav:hidden">
        <svg viewBox="0 0 720 130" style={{ display: "block", width: "100%", height: "auto" }}>
          <path d="M0,82 C210,120 490,110 720,68 L720,131 L0,131 Z" fill="#F9F7F3" />
          <path d="M0,26 C210,64 490,54 720,12 L720,68 C490,110 210,120 0,82 Z" fill="#2F3B28" />
          <path d="M0,26 C210,64 490,54 720,12" fill="none" stroke="#F3CB57" strokeWidth="2.5" />
          <path id="mtsa-mq-path-m" d="M0,56 C210,94 490,84 720,42" fill="none" />
          <text
            dominantBaseline="middle"
            style={{ fontFamily: "var(--font-body)", fontSize: 19, fontWeight: 700, letterSpacing: "2.6px", fill: "#EADBA2" }}
          >
            <textPath data-mq-tp href="#mtsa-mq-path-m" startOffset="0">
              {UNIT}
            </textPath>
          </text>
        </svg>
      </div>
    </section>
  );
}
