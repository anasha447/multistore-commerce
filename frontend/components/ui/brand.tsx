import Link from "next/link";
import type { ReactNode } from "react";

/** Centered Asul section title (DESIGN-SYSTEM.md §5). `accent` renders a word in orange italic. */
export function SectionHeading({
  children,
  accent,
  className = "",
}: {
  children: ReactNode;
  accent?: string;
  className?: string;
}) {
  return (
    <h2
      className={`text-center font-heading font-bold text-3xl md:text-4xl text-darkgreen text-balance ${className}`}
    >
      {children}
      {accent ? <em className="text-orange not-italic md:italic"> {accent}</em> : null}
    </h2>
  );
}

const PILL_BASE =
  "inline-flex items-center justify-center gap-2 rounded-full font-body font-bold transition-all duration-300 px-7 py-3";

const PILL_VARIANTS = {
  primary: "bg-green text-white hover:bg-orange hover:-translate-y-0.5",
  orange: "bg-orange text-white hover:bg-orange-hover hover:-translate-y-0.5",
  outline:
    "border-2 border-darkgreen text-darkgreen hover:border-orange hover:text-orange hover:-translate-y-0.5",
  cream: "bg-craemy text-darkgreen hover:bg-yellow hover:-translate-y-0.5",
} as const;

type PillVariant = keyof typeof PILL_VARIANTS;

/** Pill CTA (commerce buttons are always pills — BRAND.md §10.3). */
export function PillLink({
  href,
  children,
  variant = "primary",
  className = "",
}: {
  href: string;
  children: ReactNode;
  variant?: PillVariant;
  className?: string;
}) {
  return (
    <Link href={href} className={`${PILL_BASE} ${PILL_VARIANTS[variant]} ${className}`}>
      {children}
    </Link>
  );
}

export function PillButton({
  children,
  variant = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: PillVariant;
}) {
  return (
    <button type="button" {...props} className={`${PILL_BASE} ${PILL_VARIANTS[variant]} ${className}`}>
      {children}
    </button>
  );
}

/** Small pill badge (yellow default, orange for alerts/counts). */
export function BrandBadge({
  children,
  tone = "yellow",
  className = "",
}: {
  children: ReactNode;
  tone?: "yellow" | "orange";
  className?: string;
}) {
  const tones = {
    yellow: "bg-yellow text-darkgreen",
    orange: "bg-orange text-white",
  } as const;
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-body font-bold ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
