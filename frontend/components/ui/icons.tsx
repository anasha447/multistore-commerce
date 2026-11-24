// Inline SVG icons carried over verbatim from the design. `size` sets width/height
// when provided (top-bar icons); omit it to let CSS size the icon (tab bar).
import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function base({ size, ...props }: IconProps) {
  return {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    ...(size ? { width: size, height: size } : {}),
    ...props,
  };
}

export function MenuIcon({ size = 22, ...p }: IconProps) {
  return (
    <svg {...base({ size, ...p })} strokeWidth="1.8" strokeLinecap="round">
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

export function SearchIcon({ size, ...p }: IconProps) {
  return (
    <svg {...base({ size, ...p })} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

export function CartIcon({ size = 22, ...p }: IconProps) {
  return (
    <svg {...base({ size, ...p })} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="20" r="1.4" />
      <circle cx="17.5" cy="20" r="1.4" />
      <path d="M2.5 3.5h2.4l2.5 12.2a1.6 1.6 0 0 0 1.6 1.3h8.6a1.6 1.6 0 0 0 1.6-1.3l1.7-8.7H6" />
    </svg>
  );
}

export function ChevronLeftIcon({ size = 22, ...p }: IconProps) {
  return (
    <svg {...base({ size, ...p })} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

export function ChevronRightIcon({ size = 22, ...p }: IconProps) {
  return (
    <svg {...base({ size, ...p })} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

export function CloseIcon({ size = 22, ...p }: IconProps) {
  return (
    <svg {...base({ size, ...p })} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

export function MinusIcon({ size = 20, ...p }: IconProps) {
  return (
    <svg {...base({ size, ...p })} strokeWidth="1.8" strokeLinecap="round">
      <path d="M5 12h14" />
    </svg>
  );
}

export function PlusIcon({ size = 20, ...p }: IconProps) {
  return (
    <svg {...base({ size, ...p })} strokeWidth="1.8" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function FilterIcon({ size = 18, ...p }: IconProps) {
  return (
    <svg {...base({ size, ...p })} strokeWidth="1.8" strokeLinecap="round">
      <path d="M4 6h16M7 12h10M10 18h4" />
    </svg>
  );
}

export function SortIcon({ size = 18, ...p }: IconProps) {
  return (
    <svg {...base({ size, ...p })} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m7 4 0 16M7 4 4 7m3-3 3 3M17 20l0-16m0 16 3-3m-3 3-3-3" />
    </svg>
  );
}

export function HomeIcon({ size, ...p }: IconProps) {
  return (
    <svg {...base({ size, ...p })} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1Z" />
    </svg>
  );
}

export function BagIcon({ size, ...p }: IconProps) {
  return (
    <svg {...base({ size, ...p })} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.6 9.2 19 19.4a2 2 0 0 1-2 1.6H7a2 2 0 0 1-2-1.6L3.4 9.2" />
      <path d="M2.5 9.2h19" />
      <path d="M8.5 9V7a3.5 3.5 0 0 1 7 0v2" />
    </svg>
  );
}

export function HeartIcon({ size, ...p }: IconProps) {
  return (
    <svg {...base({ size, ...p })} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19.8 5.6a5 5 0 0 0-7.1 0L12 6.3l-.7-.7a5 5 0 1 0-7.1 7.1l7.8 7.8 7.8-7.8a5 5 0 0 0 0-7.1Z" />
    </svg>
  );
}

export function UserIcon({ size, ...p }: IconProps) {
  return (
    <svg {...base({ size, ...p })} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  );
}

/** Modern account icon — user inside a circle (Lucide circle-user-round). */
export function AccountIcon({ size = 22, ...p }: IconProps) {
  return (
    <svg {...base({ size, ...p })} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 20a6 6 0 0 0-12 0" />
      <circle cx="12" cy="10" r="4" />
      <circle cx="12" cy="12" r="10" />
    </svg>
  );
}

// ---- Matessa benefit/product icons (Lucide-style strokes, added for the rebuild) ----

export function LeafIcon({ size = 22, ...p }: IconProps) {
  return (
    <svg {...base({ size, ...p })} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
    </svg>
  );
}

export function ZapIcon({ size = 22, ...p }: IconProps) {
  return (
    <svg {...base({ size, ...p })} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
}

export function HeartPulseIcon({ size = 22, ...p }: IconProps) {
  return (
    <svg {...base({ size, ...p })} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
      <path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27" />
    </svg>
  );
}

export function ShieldIcon({ size = 22, ...p }: IconProps) {
  return (
    <svg {...base({ size, ...p })} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    </svg>
  );
}

export function DropletIcon({ size = 22, ...p }: IconProps) {
  return (
    <svg {...base({ size, ...p })} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" />
    </svg>
  );
}

export function FlameIcon({ size = 22, ...p }: IconProps) {
  return (
    <svg {...base({ size, ...p })} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
  );
}

export function StarIcon({ size = 18, filled = false, ...p }: IconProps & { filled?: boolean }) {
  return (
    <svg {...base({ size, ...p })} fill={filled ? "currentColor" : "none"} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.12 2.12 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.12 2.12 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.12 2.12 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.12 2.12 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.12 2.12 0 0 0 1.597-1.16z" />
    </svg>
  );
}

// ---- Social icons (footer symbols) ----

export function InstagramIcon({ size = 20, ...p }: IconProps) {
  return (
    <svg {...base({ size, ...p })} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function FacebookIcon({ size = 20, ...p }: IconProps) {
  return (
    <svg {...base({ size, ...p })} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

export function YoutubeIcon({ size = 20, ...p }: IconProps) {
  return (
    <svg {...base({ size, ...p })} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22.5 6.9a2.8 2.8 0 0 0-1.9-2C18.9 4.5 12 4.5 12 4.5s-6.9 0-8.6.4a2.8 2.8 0 0 0-1.9 2A29 29 0 0 0 1.1 12a29 29 0 0 0 .4 5.1 2.8 2.8 0 0 0 1.9 2c1.7.4 8.6.4 8.6.4s6.9 0 8.6-.4a2.8 2.8 0 0 0 1.9-2 29 29 0 0 0 .4-5.1 29 29 0 0 0-.4-5.1z" />
      <path d="m9.75 15.5 5.2-3.5-5.2-3.5z" fill="currentColor" stroke="none" />
    </svg>
  );
}
