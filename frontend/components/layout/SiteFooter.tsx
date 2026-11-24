import Link from "next/link";
import Image from "next/image";
import { CurvedDivider } from "./CurvedDivider";
import { PillLink } from "@/components/ui/brand";
import { InstagramIcon, FacebookIcon, YoutubeIcon } from "@/components/ui/icons";

const SOCIALS = [
  { label: "Instagram", href: "https://instagram.com", Icon: InstagramIcon },
  { label: "Facebook", href: "https://facebook.com", Icon: FacebookIcon },
  { label: "YouTube", href: "https://youtube.com", Icon: YoutubeIcon },
];

// Pattern texture treatment used on the dark band (verbatim from Landing v4).
const PATTERN_FILTER = "grayscale(1) invert(1) brightness(2.1) sepia(0.55) saturate(1.4)";

const linkStyle: React.CSSProperties = {
  fontFamily: "var(--font-body)",
  fontSize: 15,
  fontWeight: 600,
  color: "#D1D5DB",
  textDecoration: "none",
};

/** Footer variants per the design pages:
 *  `full`    — Landing v4/PDP: curved top (pattern-textured) → quote band → 4 link
 *              columns → bottom bar. `overlap` pulls it up over the previous section
 *              (the landing's dome), exactly like the design's negative band margin.
 *  `cta`     — Our Story: centered logo + "Find Your Blend." + Shop button + slim bar.
 *  `minimal` — Contact: single slim row. */
export function SiteFooter({
  variant = "full",
  overlap = false,
}: {
  variant?: "full" | "cta" | "minimal";
  overlap?: boolean;
}) {
  if (variant === "minimal") {
    return (
      <footer id="footer" style={{ background: "#2F3B28" }}>
        <BottomBar />
      </footer>
    );
  }

  if (variant === "cta") {
    return (
      <footer id="footer">
        <CurvedDivider />
        <div style={{ position: "relative", background: "#2F3B28" }}>
          <PatternLayer />
          <div className="relative mx-auto flex max-w-3xl flex-col items-center gap-6 px-6 py-16 text-center">
            <Image src="/brand/full-logo.webp" alt="" width={152} height={76} className="h-[76px] w-auto" />
            <h2 className="font-heading text-4xl font-bold text-craemy md:text-5xl">Find Your Blend.</h2>
            <PillLink href="/shop" variant="cream">
              Shop Matessa
            </PillLink>
          </div>
          <BottomBar />
        </div>
      </footer>
    );
  }

  return (
    <footer
      id="footer"
      style={{ position: "relative", marginTop: overlap ? "calc(-100vw * 130 / 1440)" : 0 }}
    >
      {/* Curved top with pattern texture + yellow stroke (design geometry) */}
      <div style={{ marginBottom: -1 }}>
        <svg viewBox="0 0 1440 130" aria-hidden="true" style={{ display: "block", width: "100%", height: "auto" }}>
          <defs>
            <pattern id="mtsa-ftp" patternUnits="userSpaceOnUse" width="480" height="480">
              <image href="/brand/matessa-pattern.webp" width="480" height="480" preserveAspectRatio="none" />
            </pattern>
          </defs>
          <path d="M0,100 C460,22 1020,8 1440,84 L1440,131 L0,131 Z" fill="#2F3B28" />
          <path
            d="M0,100 C460,22 1020,8 1440,84 L1440,131 L0,131 Z"
            fill="url(#mtsa-ftp)"
            style={{ opacity: 0.14, filter: PATTERN_FILTER, mixBlendMode: "screen" }}
          />
          <path d="M0,100 C460,22 1020,8 1440,84" fill="none" stroke="#F3CB57" strokeWidth="2.5" />
        </svg>
      </div>

      {/* Quote band */}
      <div style={{ position: "relative", background: "#2F3B28" }}>
        <PatternLayer />
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(180deg, rgba(47,59,40,0) 40%, rgba(47,59,40,0.92) 100%)",
            pointerEvents: "none",
          }}
        />
        <h2
          className="font-heading"
          style={{
            position: "relative",
            margin: 0,
            padding: "clamp(14px, 2vw, 28px) clamp(20px, 4vw, 48px) clamp(44px, 7vw, 88px)",
            fontWeight: 700,
            fontSize: "clamp(32px, 4.8vw, 60px)",
            lineHeight: 1.25,
            letterSpacing: "-0.01em",
            color: "#F9F7F3",
            textAlign: "center",
            textWrap: "balance",
          }}
        >
          A Sip From Nature, A Taste Of Cultures
        </h2>
      </div>

      {/* Link columns + bottom bar */}
      <div style={{ background: "#2F3B28" }}>
        <div style={{ padding: "0 clamp(20px, 4vw, 48px) 32px" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", flexDirection: "column", gap: "clamp(44px, 6vw, 64px)" }}>
            {/* Mobile: logo centered on top, then Quick Links | Customer Service (2 cols),
                then Contact full-width. Desktop: four even columns. */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-11 border-t border-white/10 pt-9 nav:grid-cols-4 nav:gap-9 nav:pt-12">
              <div className="col-span-2 flex flex-col items-center gap-3 text-center nav:col-span-1 nav:items-start nav:text-left">
                <Image src="/brand/full-logo.webp" alt="Matessa mate gourd logo" width={220} height={110} className="h-[92px] w-auto nav:h-[104px]" />
                <p style={{ fontFamily: "var(--font-body)", fontSize: 13.5, lineHeight: 1.5, color: "#AEB89E", maxWidth: 220 }}>
                  Yerba mate for a naturally focused, better lifestyle.
                </p>
              </div>
              <FooterCol
                title="Quick Links"
                links={[
                  { label: "Home", href: "/" },
                  { label: "Shop", href: "/shop" },
                  { label: "Our Story", href: "/about" },
                  { label: "Contact", href: "/contact" },
                ]}
              />
              <FooterCol
                title="Customer Service"
                links={[
                  { label: "Privacy Policy", href: "/privacy-policy" },
                  { label: "Track Order", href: "/track" },
                ]}
              />
              <ContactCol className="col-span-2 nav:col-span-1" />
            </div>
            <BottomBar bordered />
          </div>
        </div>
      </div>
    </footer>
  );
}

function PatternLayer() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        backgroundImage: "url('/brand/matessa-pattern.webp')",
        backgroundSize: "33.333vw 33.333vw",
        backgroundPosition: "0 -9.028vw",
        opacity: 0.14,
        filter: PATTERN_FILTER,
        mixBlendMode: "screen",
        pointerEvents: "none",
      }}
    />
  );
}

const colTitleStyle: React.CSSProperties = {
  margin: 0,
  fontFamily: "var(--font-heading)",
  fontSize: 20,
  fontWeight: 700,
  color: "#F3CB57",
};

function FooterCol({ title, links, className }: { title: string; links: { label: string; href: string }[]; className?: string }) {
  return (
    <nav aria-label={title} className={className} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <h3 style={colTitleStyle}>{title}</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {links.map((l) => (
          <Link
            key={l.label}
            href={l.href}
            className="transition-all duration-300 hover:pl-1 hover:!text-orange-hover"
            style={linkStyle}
          >
            {l.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

const CONTACT_ICON = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", "aria-hidden": true } as const;

function MailIcon() {
  return (
    <svg {...CONTACT_ICON}>
      <rect x="2.5" y="5" width="19" height="14" rx="2.5" stroke="#F26323" strokeWidth="2" />
      <path d="M3.5 7l8.5 6 8.5-6" stroke="#F26323" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function PhoneIcon() {
  return (
    <svg {...CONTACT_ICON}>
      <path
        d="M6.5 3h3l1.5 4-2 1.5a12 12 0 006.5 6.5L17 13l4 1.5v3a2 2 0 01-2.2 2A17 17 0 013.5 5.2 2 2 0 015.5 3z"
        stroke="#F26323"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function PinIcon() {
  return (
    <svg {...CONTACT_ICON}>
      <path d="M12 21s7-5.5 7-11a7 7 0 10-14 0c0 5.5 7 11 7 11z" stroke="#F26323" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="12" cy="10" r="2.5" stroke="#F26323" strokeWidth="2" />
    </svg>
  );
}

/** Contact column: email / phone / location with orange icons. */
function ContactCol({ className }: { className?: string }) {
  const row: React.CSSProperties = { display: "flex", alignItems: "center", gap: 12 };
  return (
    <div className={className} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <h3 style={colTitleStyle}>Contact Us</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <a href="mailto:support@matessa.in" style={{ ...row, ...linkStyle }} className="transition-colors duration-300 hover:!text-orange-hover">
          <MailIcon />
          support@matessa.in
        </a>
        <a href="tel:+917984191716" style={{ ...row, ...linkStyle }} className="transition-colors duration-300 hover:!text-orange-hover">
          <PhoneIcon />
          +91 7984191716
        </a>
        <span style={{ ...row, ...linkStyle }}>
          <PinIcon />
          Lucknow, India
        </span>
      </div>
    </div>
  );
}

function BottomBar({ bordered = false }: { bordered?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 18,
        borderTop: bordered ? "1px solid rgba(255,255,255,0.10)" : undefined,
        padding: bordered ? "24px 0 0" : "20px clamp(20px, 4vw, 48px)",
        position: "relative",
      }}
    >
      <div style={{ fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 500, color: "rgba(209,213,219,0.7)" }}>
        © 2026 Matessa · matessa.in
      </div>
      <div style={{ display: "flex", gap: 14 }}>
        {SOCIALS.map((s) => (
          <a
            key={s.label}
            href={s.href}
            aria-label={s.label}
            rel="noopener noreferrer"
            target="_blank"
            className="grid h-9 w-9 place-items-center rounded-full text-[#D1D5DB] transition-colors duration-300 hover:bg-white/10 hover:text-orange"
          >
            <s.Icon size={19} />
          </a>
        ))}
      </div>
    </div>
  );
}
