import Image from "next/image";

/** Shop hero — a deep-green band with the Matessa pattern tinted green behind a single,
 *  centred title. The pattern sits on a green wash (soft-light blend + green mask layer)
 *  so it reads as an elegant green texture rather than its raw colours. */
export function ShopHero({ title = "Products" }: { title?: string }) {
  return (
    <section className="relative isolate overflow-hidden bg-darkgreen">
      {/* Green-filtered pattern backdrop */}
      <div className="absolute inset-0" aria-hidden="true">
        {/* raw pattern, softened + blended into the green base */}
        <Image
          src="/brand/matessa-pattern.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-30 mix-blend-soft-light"
        />
        {/* a second, mask-based layer paints the pattern in solid brand green so the
            tint is consistent regardless of the source artwork's colours */}
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundColor: "#7A9D3E",
            WebkitMaskImage: "url(/brand/matessa-pattern.webp)",
            maskImage: "url(/brand/matessa-pattern.webp)",
            WebkitMaskSize: "340px auto",
            maskSize: "340px auto",
            WebkitMaskRepeat: "repeat",
            maskRepeat: "repeat",
          }}
        />
        {/* top glow + bottom fade for depth */}
        <div className="absolute inset-0 bg-[radial-gradient(120%_120%_at_50%_-10%,rgba(122,157,62,0.4),transparent_55%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-darkgreen/80" />
      </div>

      <div className="relative mx-auto flex max-w-[1200px] items-center justify-center px-5 py-16 nav:px-8 nav:py-28">
        <h1 className="text-center font-heading font-bold text-craemy [font-size:clamp(52px,9vw,112px)] leading-[0.95] drop-shadow-[0_2px_24px_rgba(0,0,0,0.25)]">
          {title}
        </h1>
      </div>
    </section>
  );
}
