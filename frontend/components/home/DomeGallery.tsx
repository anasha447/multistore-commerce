"use client";

// "Who Drinks Mate?" — faithful port of Matessa Landing v4 §Who Drinks Mate.
// Staggered-column photo sphere (35 segments, 5 rows offset per column) viewed from
// inside; pointer-drag rotates with smoothing (rot += (target-rot)*0.08) and release
// inertia; tap (not drag) opens the grayscale overlay. Radius is responsive via
// ResizeObserver. Vertical flick on touch scrolls the page like the design.

import { useEffect, useRef, useState } from "react";

const IMAGES = [
  "/brand/gal-messi2.webp",
  "/brand/gal-yani.webp",
  "/brand/gal-43.webp",
  "/brand/gal-inch.webp",
  "/brand/gal-suarez.webp",
  "/brand/gal-nymar.webp",
  "/brand/gal-maradona.webp",
  "/brand/gal-review2.webp",
  "/brand/gal-chivara.webp",
  "/brand/gal-alex.webp",
  "/brand/gal-review3.webp",
];

const SEG = 35;
const UNIT = 360 / SEG / 2;
const EVEN_YS = [-4, -2, 0, 2, 4];
const ODD_YS = [-3, -1, 1, 3, 5];

const clampN = (v: number, a: number, b: number) => Math.min(Math.max(v, a), b);

export function DomeGallery() {
  const [mounted, setMounted] = useState(false);
  const [zoom, setZoom] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const sphereRef = useRef<HTMLDivElement>(null);
  const moved = useRef(false);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    const root = rootRef.current;
    const sphere = sphereRef.current;
    if (!root || !sphere) return;

    // Responsive radius, exactly like the design.
    const ro = new ResizeObserver((entries) => {
      const cr = entries[0].contentRect;
      const w = Math.max(1, cr.width);
      const h = Math.max(1, cr.height);
      const basis = w / h >= 1.3 ? w : Math.min(w, h);
      let radius = Math.min(basis * 0.5, h * 1.35);
      radius = Math.max(w < 768 ? 620 : 900, Math.min(radius, 1400));
      root.style.setProperty("--radius", `${Math.round(radius)}px`);
    });
    ro.observe(root);

    const rot = { x: 0, y: 0 };
    const target = { x: 0, y: 0 };
    const apply = () => {
      sphere.style.transform = `translateZ(calc(var(--radius) * -1)) rotateX(${rot.x}deg) rotateY(${rot.y}deg)`;
    };
    apply();
    let raf = 0;
    const loop = () => {
      rot.x += (target.x - rot.x) * 0.08;
      rot.y += (target.y - rot.y) * 0.08;
      apply();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const stage = root.querySelector<HTMLElement>(".mtsa-stage");
    if (!stage) return;
    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    if (isTouch) stage.style.touchAction = "none";

    let start: { x: number; y: number } | null = null;
    let startRot: { x: number; y: number } | null = null;
    let lastX = 0, lastY = 0, lastT = 0, vx = 0, vy = 0;

    const down = (e: PointerEvent) => {
      start = { x: e.clientX, y: e.clientY };
      startRot = { x: target.x, y: target.y };
      lastX = e.clientX; lastY = e.clientY; lastT = performance.now(); vx = 0; vy = 0;
      // NB: do NOT capture the pointer here — on desktop a captured pointer swallows the
      // subsequent click, so tapping a tile to zoom never fired. Capture only once a drag
      // actually starts (below), so a plain click still reaches the tile.
    };
    const move = (e: PointerEvent) => {
      if (!start || !startRot) return;
      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      if (!moved.current && dx * dx + dy * dy > 36) {
        moved.current = true;
        try { stage.setPointerCapture(e.pointerId); } catch { /* best-effort */ }
      }
      if (!moved.current) return;
      target.x = clampN(startRot.x - dy / 26, -15, 15);
      target.y = startRot.y + dx / 26;
      const now = performance.now();
      if (now - lastT > 0) {
        vx = (e.clientX - lastX) / (now - lastT);
        vy = (e.clientY - lastY) / (now - lastT);
      }
      lastX = e.clientX; lastY = e.clientY; lastT = now;
    };
    const end = () => {
      if (!start) return;
      start = null;
      if (moved.current) {
        if (isTouch && Math.abs(vy) > 0.9 && Math.abs(vy) > Math.abs(vx) * 1.3) {
          if (vy < 0) {
            const f = document.getElementById("footer");
            if (f) window.scrollBy({ top: f.getBoundingClientRect().top, behavior: "smooth" });
          } else {
            window.scrollBy({ top: -window.innerHeight * 0.9, behavior: "smooth" });
          }
        } else {
          target.y += clampN(vx, -1.2, 1.2) * 110;
          target.x = clampN(target.x - clampN(vy, -0.8, 0.8) * 8, -15, 15);
        }
        setTimeout(() => {
          moved.current = false;
        }, 120);
      }
    };
    stage.addEventListener("pointerdown", down);
    stage.addEventListener("pointermove", move);
    stage.addEventListener("pointerup", end);
    stage.addEventListener("pointercancel", end);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      stage.removeEventListener("pointerdown", down);
      stage.removeEventListener("pointermove", move);
      stage.removeEventListener("pointerup", end);
      stage.removeEventListener("pointercancel", end);
    };
  }, [mounted]);

  // Tiles: columns x = -37 + c*2, rows staggered per column parity.
  const tiles: { yaw: number; pitch: number; src: string }[] = [];
  let k = 0;
  for (let c = 0; c < SEG; c++) {
    const x = -37 + c * 2;
    const ys = c % 2 === 0 ? EVEN_YS : ODD_YS;
    for (const y of ys) {
      tiles.push({ yaw: UNIT * (x + 0.5), pitch: UNIT * (y - 0.5), src: IMAGES[k % IMAGES.length] });
      k++;
    }
  }

  return (
    <section id="gallery" style={{ background: "#F9F7F3" }}>
      <h2
        className="font-heading"
        style={{
          margin: 0,
          padding: "clamp(56px, 7vw, 116px) 20px clamp(26px, 4vw, 44px)",
          fontWeight: 700,
          fontSize: "clamp(32px, 3.8vw, 50px)",
          letterSpacing: "-0.01em",
          color: "#2F3B28",
          textAlign: "center",
        }}
      >
        Who Drinks Mate?
      </h2>
      <div style={{ position: "relative", overflow: "hidden", background: "#4A4133" }}>
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "url('/brand/bgdemo.webp')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "grayscale(1) brightness(0.92)",
          }}
        />
        {/* soft cream curve at the top — the dark gallery arches UP into the white space
            (convex: thin cream in the middle, thicker at the edges). */}
        <svg
          aria-hidden="true"
          viewBox="0 0 1440 120"
          preserveAspectRatio="none"
          style={{ position: "absolute", top: -1, left: 0, width: "100%", height: "clamp(48px, 6vw, 100px)", zIndex: 5, display: "block" }}
        >
          <path d="M0,0 L1440,0 L1440,96 C1080,12 360,12 0,96 Z" fill="#F9F7F3" />
        </svg>
        <div
          ref={rootRef}
          className={`mtsa-dome${zoom ? " mtsa-dome-open" : ""}`}
          // Width-based so the dome is compact on phones and grows on desktop.
          // (svh made it ~750px on a tall phone but only ~735px on a laptop.)
          style={{ position: "relative", height: "clamp(560px, 60vw, 980px)" }}
        >
          <div
            style={{
              position: "absolute",
              bottom: "calc(9vw + 14px)",
              left: 0,
              right: 0,
              zIndex: 10,
              fontFamily: "var(--font-body)",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "rgba(249,247,243,0.75)",
              textAlign: "center",
              pointerEvents: "none",
            }}
          >
            Drag to Explore · Tap a Photo
          </div>
          <div className="mtsa-stage" role="group" aria-label="Draggable photo dome of mate drinkers">
            <div className="mtsa-sphere" ref={sphereRef}>
              {mounted &&
                tiles.map((t, i) => (
                  <div
                    key={i}
                    className="mtsa-sphere-item"
                    style={{ transform: `rotateY(${t.yaw}deg) rotateX(${t.pitch}deg) translateZ(var(--radius))` }}
                  >
                    <div
                      className="mtsa-tile"
                      onClick={() => {
                        if (!moved.current) setZoom(t.src);
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={t.src} alt="Mate drinker" draggable={false} loading="lazy" />
                    </div>
                  </div>
                ))}
            </div>
          </div>
          <div className="mtsa-dome-overlay" onClick={() => setZoom(null)} role="dialog" aria-label="Photo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {zoom && <img src={zoom} alt="Mate drinker enlarged" />}
          </div>
        </div>
      </div>
    </section>
  );
}
