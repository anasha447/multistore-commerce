/** Curved SVG band divider — the brand's curve motif (BRAND.md §4).
 *  Renders the design's 1440×130 arc (720×130 under the nav breakpoint via a second
 *  path + media classes). `flip` mirrors it vertically for section bottoms. */
export function CurvedDivider({
  fill = "#2F3B28",
  stroke = "#F3CB57",
  flip = false,
  className = "",
}: {
  fill?: string;
  stroke?: string;
  flip?: boolean;
  className?: string;
}) {
  return (
    <div className={`${flip ? "rotate-180" : ""} ${className}`} aria-hidden="true">
      {/* Desktop curve */}
      <svg viewBox="0 0 1440 130" preserveAspectRatio="none" className="hidden nav:block w-full h-[80px] lg:h-[110px]">
        <path d="M0,96 C360,10 1080,10 1440,96 L1440,130 L0,130 Z" fill={fill} />
        <path d="M0,96 C360,10 1080,10 1440,96" fill="none" stroke={stroke} strokeWidth="4" />
      </svg>
      {/* Mobile curve (tighter arc) */}
      <svg viewBox="0 0 720 130" preserveAspectRatio="none" className="nav:hidden w-full h-[56px]">
        <path d="M0,100 C180,24 540,24 720,100 L720,130 L0,130 Z" fill={fill} />
        <path d="M0,100 C180,24 540,24 720,100" fill="none" stroke={stroke} strokeWidth="4" />
      </svg>
    </div>
  );
}
