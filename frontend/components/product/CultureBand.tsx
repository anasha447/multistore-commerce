/** PDP culture band (design: Product Page.dc.html §Culture) — dark-green card with the
 *  matessa-pattern texture, yellow Asul heading + copy, and a looping culture video. */
export function CultureBand() {
  return (
    <section className="mx-auto max-w-[1200px] px-5 py-12 nav:px-8">
      <div className="relative overflow-hidden rounded-[2rem] bg-darkgreen">
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage: "url('/brand/matessa-pattern.webp')",
            backgroundSize: "360px",
            mixBlendMode: "screen",
          }}
        />
        {/* video is flush to the card edges — padding lives on the text column only */}
        <div className="relative flex flex-col items-stretch nav:flex-row nav:items-stretch">
          <div className="flex-1 p-8 nav:p-14">
            <h2 className="font-heading font-bold text-yellow [font-size:clamp(30px,3.6vw,50px)] leading-[1.14]">
              Good Things Are Growing In The Shade
            </h2>
            <p className="mt-5 max-w-[48ch] font-body text-[15px] font-medium leading-[1.8] text-craemy/90 nav:text-[17px]">
              Long before energy drinks, there was mate. For centuries this has been the daily natural fuel of South
              America, yet it remains a secret here in Asia. Be among the first to discover the forest&apos;s ancient
              answer to lasting energy and focus.
            </p>
          </div>
          <div className="w-full flex-1">
            <video
              src="/wim/culture.mp4"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              aria-label="Yerba mate growing in the shade"
              className="h-full min-h-[300px] w-full object-cover nav:min-h-[460px]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
