// "Better Than Tea. Smarter Than Coffee." — faithful port of Matessa Landing v4
// §Energy Comparison. Row-reverse layout (chart card right on desktop), the design's
// exact chart geometry (axes #D8CCB8, dashed coffee/tea curves with white data dots,
// solid mate line, floating legend card), and the three comparison cards with colored
// dots + uppercase Asul titles; Yerba Mate is the highlighted winner. No JS.

import { Reveal } from "@/components/Reveal";

const CARDS = [
  {
    name: "Coffee",
    dot: "#EF4444",
    copy: "Quick spike followed by an energy crash within 2–3 hours. Often accompanied by jitters and anxiety.",
    highlight: false,
  },
  {
    name: "Tea",
    dot: "#F3CB57",
    copy: "Gentler lift but lower energy levels. May not provide enough sustained focus for demanding tasks.",
    highlight: false,
  },
  {
    name: "Yerba Mate",
    dot: "#3E5F2D",
    copy: "Smooth, steady energy for 4–6 hours. Sharp focus with no crash and no jitters.",
    highlight: true,
  },
];

export function EnergyComparison() {
  return (
    <section id="energy" aria-label="Energy Comparison" style={{ background: "#F9F7F3", padding: "clamp(60px, 8vw, 110px) clamp(20px, 4vw, 48px)" }}>
      <div style={{ maxWidth: 1160, margin: "0 auto", display: "flex", flexDirection: "column", gap: "clamp(36px, 4.5vw, 52px)" }}>
        <Reveal>
          <h2
            className="font-heading"
            style={{ margin: 0, fontWeight: 700, fontSize: "clamp(30px, 3.4vw, 40px)", lineHeight: 1.25, color: "#2F3B28", textAlign: "center", textWrap: "balance" }}
          >
            Better Than Tea.
            <br />
            Smarter Than Coffee.
          </h2>
        </Reveal>

        <div style={{ display: "flex", flexDirection: "row-reverse", flexWrap: "wrap", gap: "clamp(24px, 3.5vw, 56px)", alignItems: "center" }}>
          {/* Chart card */}
          <Reveal className="min-w-[300px] flex-[1_1_440px]">
            <div
              style={{
                background: "#FCF0E3",
                border: "1px solid rgba(242,99,35,0.12)",
                borderRadius: "2rem",
                padding: "clamp(22px, 2.6vw, 36px)",
                boxShadow: "inset 0 2px 8px rgba(24,32,16,0.05)",
                display: "flex",
                flexDirection: "column",
                gap: 20,
              }}
            >
              <h3
                className="font-heading"
                style={{ margin: 0, textAlign: "center", fontWeight: 700, fontSize: 18, letterSpacing: "0.08em", textTransform: "uppercase", color: "#2F3B28" }}
              >
                Energy Over Time
              </h3>
              <div style={{ position: "relative", padding: "30px 8px 26px 30px" }}>
                <div
                  style={{
                    position: "absolute",
                    left: -18,
                    top: "55%",
                    transform: "translateY(-50%) rotate(-90deg)",
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: "rgba(47,59,40,0.45)",
                    whiteSpace: "nowrap",
                  }}
                >
                  Energy Level
                </div>
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: "55%",
                    transform: "translateX(-50%)",
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: "rgba(47,59,40,0.45)",
                    whiteSpace: "nowrap",
                  }}
                >
                  Time (Hours)
                </div>
                {/* legend */}
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    right: 8,
                    zIndex: 2,
                    background: "rgba(255,255,255,0.85)",
                    padding: "8px 12px",
                    borderRadius: 10,
                    border: "1px solid rgba(62,95,45,0.14)",
                    boxShadow: "0 1px 4px rgba(24,32,16,0.08)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 5,
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#2F3B28",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#3E5F2D", border: "1px solid #FFFFFF", boxShadow: "0 0 0 1px rgba(62,95,45,0.3)", flex: "none" }} />
                    <span>Mate</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#FFFFFF", border: "2px solid #EF4444", flex: "none" }} />
                    <span>Coffee</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#FFFFFF", border: "2px solid #F3CB57", flex: "none" }} />
                    <span>Tea</span>
                  </div>
                </div>
                <svg viewBox="0 0 400 300" role="img" aria-label="Line chart: coffee spikes then crashes, tea stays low, mate holds a steady plateau" style={{ width: "100%", height: "auto", display: "block", overflow: "visible" }}>
                  <line x1="20" y1="280" x2="380" y2="280" stroke="#D8CCB8" strokeWidth="2" strokeLinecap="round" />
                  <line x1="20" y1="280" x2="20" y2="20" stroke="#D8CCB8" strokeWidth="2" strokeLinecap="round" />
                  <path d="M 20 280 C 50 150, 100 50, 120 80 C 140 110, 180 250, 320 275" fill="none" stroke="#EF4444" strokeWidth="3" strokeLinecap="round" strokeDasharray="5,5" />
                  <circle cx="20" cy="280" r="5" fill="white" stroke="#EF4444" strokeWidth="2.5" />
                  <circle cx="120" cy="80" r="5" fill="white" stroke="#EF4444" strokeWidth="2.5" />
                  <path d="M 20 280 C 60 220, 120 150, 160 150 C 200 150, 280 200, 350 230" fill="none" stroke="#F3CB57" strokeWidth="3" strokeLinecap="round" strokeDasharray="8" />
                  <circle cx="20" cy="280" r="5" fill="white" stroke="#F3CB57" strokeWidth="2.5" />
                  <circle cx="160" cy="150" r="5" fill="white" stroke="#F3CB57" strokeWidth="2.5" />
                  <path d="M 20 280 C 50 200, 80 100, 140 100 L 260 100 C 300 100, 340 120, 380 150" fill="none" stroke="#3E5F2D" strokeWidth="3.5" strokeLinecap="round" />
                  <circle cx="20" cy="280" r="6" fill="#3E5F2D" stroke="white" strokeWidth="3" />
                  <circle cx="140" cy="100" r="6" fill="#3E5F2D" stroke="white" strokeWidth="3" />
                </svg>
              </div>
            </div>
          </Reveal>

          {/* Comparison cards */}
          <div className="flex min-w-[300px] flex-[1_1_400px] flex-col" style={{ gap: 16 }}>
            {CARDS.map((c, i) => (
              <Reveal key={c.name} delay={i * 110}>
                <div
                  style={{
                    padding: "22px 24px",
                    borderRadius: 18,
                    background: c.highlight ? "#E8F3E8" : "#FFFFFF",
                    border: c.highlight ? "2px solid #3E5F2D" : "2px solid transparent",
                    boxShadow: c.highlight ? "0 10px 24px rgba(62,95,45,0.16)" : "0 1px 2px rgba(0,0,0,0.04)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ width: 12, height: 12, borderRadius: "50%", background: c.dot, boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.08)", flex: "none" }} />
                    <h3
                      className="font-heading"
                      style={{ margin: 0, fontWeight: 700, fontSize: 19, letterSpacing: "0.06em", textTransform: "uppercase", color: c.highlight ? "#2F3B28" : "#1F2937" }}
                    >
                      {c.name}
                    </h3>
                  </div>
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 500, lineHeight: 1.6, color: c.highlight ? "#3E4A38" : "#4B5563" }}>{c.copy}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
