import type { Metadata } from "next";
import Image from "next/image";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Reveal } from "@/components/Reveal";

export const metadata: Metadata = {
  title: "Our Story — Matessa",
  description: "We are on a mission to help the world feel better, one sip at a time. The story behind Matessa.",
};

const CHAPTERS = [
  {
    n: "01",
    title: "Rooted in Culture",
    image: "/brand/story-matecup.webp",
    alt: "A hand holding a traditional mate gourd in nature",
    body: "In my community, yerba mate was more than an energy drink — it's a daily ritual of connection with family and friends. In South America the native people call it the drink of the gods; it gives a legendary clean energy. For centuries, mate has been an ancient symbol of community.",
  },
  {
    n: "02",
    title: "The Beginning",
    image: "/brand/story-masala.webp",
    alt: "Colorful Indian herbs and spices in wooden bowls",
    body: "In my early twenties, travelling through India — a land of vibrant colors and ancient wisdom — I became immersed in the magic of Indian herbs. The depth of those flavors and the tradition behind them sparked something new in me.",
  },
  {
    n: "03",
    title: "The Birth of Matessa",
    image: "/brand/story-branding.webp",
    alt: "Matessa brand mark over a field of green mate leaves",
    body: "Matessa was inspired by the magic of Indian herbs, creating a unique harmony with South American yerba mate. Matessa is not just a drink — it's a bridge connecting nature, cultures, and communities.",
  },
];

export default function AboutPage() {
  return (
    <>
      <SiteHeader />
      <main>
        {/* Banner */}
        <section className="relative grid min-h-[46svh] place-items-center overflow-hidden nav:min-h-[70svh]">
          <Image src="/brand/story-banner.webp" alt="" fill priority sizes="100vw" className="object-cover" />
          <div className="absolute inset-0" style={{ background: "rgba(15,20,10,0.42)", backdropFilter: "blur(3px)" }} />
          <Reveal className="relative px-6 text-center">
            <h1 className="font-heading font-bold text-[#FDF5E6] [font-size:clamp(34px,5vw,66px)] leading-[1.1]">
              We are on a Mission To Help
              <br />
              The World Feel Better
              <br />
              One Sip at a Time.
            </h1>
          </Reveal>
        </section>

        {/* Chapters */}
        <div className="mx-auto max-w-[1160px] px-6 py-16 nav:py-24">
          {CHAPTERS.map((c, i) => (
            <div
              key={c.n}
              className={`mb-16 flex flex-col items-center gap-8 nav:mb-24 nav:gap-14 ${
                i % 2 === 1 ? "nav:flex-row-reverse" : "nav:flex-row"
              }`}
            >
              <Reveal className="w-full flex-1">
                <Image
                  src={c.image}
                  alt={c.alt}
                  width={520}
                  height={420}
                  className="h-[400px] w-full rounded-[2rem] object-cover shadow-lg nav:h-[530px]"
                />
              </Reveal>
              <Reveal delay={120} className="flex-1">
                <span className="font-heading text-5xl font-bold text-darkgreen/10">{c.n}</span>
                <h2 className="mt-1 font-heading text-2xl font-bold text-darkgreen nav:text-3xl">{c.title}</h2>
                <p className="mt-4 font-body leading-relaxed text-gray-600">{c.body}</p>
              </Reveal>
            </div>
          ))}
        </div>
      </main>
      <SiteFooter variant="full" />
    </>
  );
}
