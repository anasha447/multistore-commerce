"use client";

// "Covering All Aspects of Health" — faithful port of Matessa Landing v4 §After-Banner.
// Four orange focus words cycle every 1.5s; the corner-bracket reticle is measured to
// the active word's exact rect (brackets protrude via their own -6/-9px offsets).
// Inactive words blur(4px) + dim. CTAs: Try Now → /shop, Don't know Mate?! → /what-is-mate.

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Reveal } from "@/components/Reveal";

const WORDS = ["Energy", "Focus", "Gut Health", "Immunity"];

const bracket = (pos: React.CSSProperties): React.CSSProperties => ({
  position: "absolute",
  width: 12,
  height: 12,
  border: "2px solid #F26323",
  borderRadius: 3,
  ...pos,
});

export function HealthFocus() {
  const [focusI, setFocusI] = useState(0);
  const [box, setBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    const id = setInterval(() => {
      if (document.hidden) return;
      setFocusI((i) => (i + 1) % WORDS.length);
    }, 1500);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const measure = () => {
      const el = wordRefs.current[focusI];
      const hostEl = containerRef.current;
      if (!el || !hostEl) return;
      const a = el.getBoundingClientRect();
      const b = hostEl.getBoundingClientRect();
      setBox({ x: a.left - b.left, y: a.top - b.top, w: a.width, h: a.height });
    };
    const t = setTimeout(measure, 60);
    window.addEventListener("resize", measure);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", measure);
    };
  }, [focusI]);

  return (
    <section
      id="health"
      style={{
        position: "relative",
        zIndex: 10,
        background: "#F9F7F3",
        overflow: "hidden",
        padding: "clamp(70px, 9vw, 120px) clamp(20px, 4vw, 48px)",
      }}
    >
      {/* radial glow */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "80%",
          height: "80%",
          borderRadius: "50%",
          opacity: 0.3,
          filter: "blur(64px)",
          pointerEvents: "none",
          background: "radial-gradient(circle, #FDE4D8 0%, transparent 70%)",
        }}
      />
      <div
        style={{
          position: "relative",
          zIndex: 2,
          maxWidth: 880,
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          gap: 26,
        }}
      >
        {/* Focus text + reticle */}
        <div
          ref={containerRef}
          style={{
            position: "relative",
            display: "flex",
            gap: "clamp(12px, 2.6vw, 26px)",
            justifyContent: "center",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          {WORDS.map((w, i) => (
            <span
              key={w}
              ref={(el) => {
                wordRefs.current[i] = el;
              }}
              style={{
                fontFamily: "var(--font-body)",
                fontWeight: 700,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                fontSize: "clamp(13px, 1.2vw, 16px)",
                color: "#F26323",
                filter: i === focusI ? "blur(0px)" : "blur(4px)",
                opacity: i === focusI ? 1 : 0.4,
                transform: i === focusI ? "scale(1.05)" : "scale(1)",
                transition: "filter 0.5s ease, opacity 0.5s ease, transform 0.5s ease",
                whiteSpace: "nowrap",
              }}
            >
              {w}
            </span>
          ))}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              pointerEvents: "none",
              width: box?.w ?? 0,
              height: box?.h ?? 0,
              transform: `translate(${box?.x ?? 0}px, ${box?.y ?? 0}px)`,
              opacity: box ? 0.9 : 0,
              transition:
                "transform 0.5s ease-in-out, width 0.5s ease-in-out, height 0.5s ease-in-out, opacity 0.5s ease",
            }}
          >
            <span style={bracket({ top: -6, left: -9, borderRight: 0, borderBottom: 0 })} />
            <span style={bracket({ top: -6, right: -9, borderLeft: 0, borderBottom: 0 })} />
            <span style={bracket({ bottom: -6, left: -9, borderRight: 0, borderTop: 0 })} />
            <span style={bracket({ bottom: -6, right: -9, borderLeft: 0, borderTop: 0 })} />
          </div>
        </div>

        <Reveal>
          <h2
            className="font-heading"
            style={{
              margin: 0,
              fontWeight: 700,
              fontSize: "clamp(34px, 4.6vw, 60px)",
              lineHeight: 1.12,
              letterSpacing: "-0.01em",
              color: "#2F3B28",
              textWrap: "balance",
            }}
          >
            Covering All Aspects <span style={{ color: "#F26323" }}>of Health</span>
          </h2>
        </Reveal>

        <Reveal delay={150}>
          <p
            style={{
              margin: 0,
              maxWidth: "58ch",
              fontSize: "clamp(16px, 1.4vw, 20px)",
              fontWeight: 500,
              lineHeight: 1.7,
              color: "#4A5545",
            }}
          >
            Experience{" "}
            <strong style={{ color: "#2F3B28" }}>
              balanced <span style={{ color: "#F26323" }}>energy</span> &amp; calm{" "}
              <span style={{ color: "#3E5F2D" }}>clarity</span>
            </strong>{" "}
            — a clean, natural lift without the jitters,{" "}
            
              elevating your well-being
            
            every day.
          </p>
        </Reveal>

        <Reveal delay={300}>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: 16, marginTop: 6 }}>
            <Link
              href="/shop"
              className="transition-all duration-300 hover:-translate-y-[3px] hover:bg-orange-hover"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 15,
                fontWeight: 700,
                color: "#F9F7F3",
                background: "#F26323",
                padding: "14px 34px",
                borderRadius: 999,
                whiteSpace: "nowrap",
                textDecoration: "none",
                boxShadow: "0 10px 22px rgba(242,99,35,0.25)",
              }}
            >
              Try Now
            </Link>
            <Link
              href="/what-is-mate"
              className="transition-all duration-300 hover:-translate-y-[3px] hover:bg-darkgreen/5"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 15,
                fontWeight: 700,
                color: "#2F3B28",
                background: "transparent",
                border: "1px solid #2F3B28",
                padding: "13px 34px",
                borderRadius: 999,
                whiteSpace: "nowrap",
                textDecoration: "none",
              }}
            >
              Don&apos;t know Mate?!
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
