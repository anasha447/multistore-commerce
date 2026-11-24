"use client";

// What-is-Mate storytelling sections (design: src/*.jsx). Intro, scroll-scrubbed
// timeline, harmony, preparation ritual (6 videos), and the parallax quote — ported
// to typed React + framer-motion. Honors prefers-reduced-motion throughout.

import { useRef, useState } from "react";
import Image from "next/image";
import { motion, useScroll, useSpring, useTransform, useReducedMotion } from "framer-motion";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/icons";
import { StackGallery } from "./StackGallery";

const REVEAL = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.3 },
  transition: { duration: 0.55, ease: "easeOut" as const },
};

/* ---- 1. Intro ---- */
export function WhatIsMateIntro() {
  return (
    <section className="relative overflow-hidden bg-craemy px-6 py-16 nav:px-20">
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-20"
        style={{ backgroundImage: "url('/brand/matessa-pattern.webp')", backgroundSize: "460px", mixBlendMode: "multiply" }}
      />
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 nav:grid-cols-2">
        <motion.div {...REVEAL}>
          <div className="mb-4 font-body text-lg font-semibold leading-relaxed text-black">
            <h2 className="mr-2 inline font-heading text-3xl font-bold text-black">Yerba Mate</h2>
            <span>
              (pronounced <em>mah-teh</em>) comes from the holly tree of South America&apos;s green forests. Long ago the
              Guaraní nations of Paraguay, Argentina and Brazil were the first to brew its leaves — a gift of nature for
              energy, focus and strength, and a way to sit together and share stories. From the very beginning, mate was
              more than a drink: a tradition of health, friendship and community.
            </span>
          </div>
          <p className="font-body text-lg font-semibold leading-relaxed text-black">
            From the streets of Buenos Aires to the cafés of Europe, mate has become a global favorite — a natural
            alternative to coffee for athletes, artists and health lovers alike.
          </p>
        </motion.div>
        <motion.div {...REVEAL} className="flex items-center justify-center">
          <StackGallery />
        </motion.div>
      </div>
    </section>
  );
}

/* ---- 2. Timeline (scroll-scrubbed) ---- */
const TIMELINE = [
  { year: "1600s", title: "The Beginnings", event: "Consumed by the Guaraní people for energy and sustenance." },
  { year: "1700s", title: "The Adoption", event: "Spanish colonists adopt mate, spreading it across South America." },
  { year: "1800s", title: "National Icon", event: "Becomes the national drink of Argentina, Uruguay and Paraguay." },
  { year: "1900s", title: "Expansion", event: "Mate culture crosses into Chile, Brazil and the Middle East." },
  { year: "2000s", title: "Global Reach", event: "Exports surge worldwide; mate becomes a hit in Europe & the USA." },
  { year: "2026", title: "Modern Fusion", event: "New blends like Masala & Lemon gain popularity in India and beyond." },
];

export function MateTimeline() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start center", "end center"] });
  const progress = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });
  const logoTop = useTransform(progress, [0, 1], ["0%", "100%"]);
  // Logo tints from green to orange as it reaches the end of the line.
  const logoColor = useTransform(progress, [0.82, 1], ["#3E5F2D", "#F26323"]);

  return (
    <section className="relative overflow-hidden bg-white py-20">
      <h2 className="mb-14 text-center font-heading text-4xl font-bold text-darkgreen md:text-5xl">Mate Time Line</h2>
      <div ref={ref} className="relative mx-auto min-h-[900px] max-w-5xl px-2 nav:px-6">
        {/* center line */}
        <div className="pointer-events-none absolute bottom-24 left-1/2 top-0 z-40 w-1 -translate-x-1/2">
          <div className="absolute left-1/2 top-0 h-full w-0.5 -translate-x-1/2 bg-darkgreen/10" />
          <motion.div style={{ scaleY: progress, originY: 0 }} className="absolute left-1/2 top-0 h-full w-0.5 -translate-x-1/2 bg-darkgreen" />
          <motion.div style={{ top: logoTop }} className="absolute left-[-20px] z-50 h-10 w-10 nav:left-[-30px] nav:h-16 nav:w-16">
            <motion.div
              className="h-full w-full"
              style={{
                backgroundColor: logoColor,
                WebkitMaskImage: "url('/wim/full.logo.webp')",
                maskImage: "url('/wim/full.logo.webp')",
                WebkitMaskSize: "contain",
                maskSize: "contain",
                WebkitMaskRepeat: "no-repeat",
                maskRepeat: "no-repeat",
                WebkitMaskPosition: "center",
                maskPosition: "center",
              }}
            />
          </motion.div>
        </div>

        <div className="relative z-10 pb-24">
          {TIMELINE.map((item, i) => {
            const even = i % 2 === 0;
            return (
              <div key={item.year} className={`relative mb-20 flex w-full items-center justify-between ${even ? "flex-row-reverse" : ""}`}>
                {/* year marker dot, centered on the line */}
                <span
                  aria-hidden="true"
                  className="absolute left-1/2 top-1/2 z-30 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#F9F7F3] bg-darkgreen shadow-[0_0_0_3px_rgba(47,59,40,0.10)]"
                />
                <motion.div
                  initial={{ opacity: 0, x: even ? -20 : 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className={`w-[42%] nav:w-5/12 ${even ? "pr-4 text-right nav:pr-12" : "pl-4 text-left nav:pl-12"}`}
                >
                  <span className="mb-1 block select-none font-heading text-3xl font-bold text-darkgreen/10 nav:text-5xl">{item.year}</span>
                  <h3 className="mb-1 font-heading text-lg font-bold text-darkgreen nav:text-xl">{item.title}</h3>
                  <p className="font-body text-xs font-semibold leading-relaxed text-gray-600 nav:text-base">{item.event}</p>
                </motion.div>
                <div className="w-[42%] nav:w-5/12" />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ---- 3. The Magic Harmony ---- */
export function IndianMateStory() {
  const reduce = useReducedMotion();
  return (
    <section className="relative overflow-hidden px-6 py-16">
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#F9F7F3] via-[#fffbf2] to-[#FFF7ED]" />
      <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center text-center">
        <motion.h2 {...REVEAL} className="mb-10 font-heading text-3xl font-bold text-darkgreen md:text-5xl">
          The Magic Harmony
        </motion.h2>
        <motion.div
          className="relative mb-10"
          animate={reduce ? undefined : { y: [-8, 8, -8], rotate: [-1, 1, -1] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="relative aspect-video w-full max-w-lg overflow-hidden rounded-3xl border-4 border-white bg-white shadow-2xl nav:max-w-3xl">
            <Image src="/wim/HARMONY.webp" alt="Yerba mate meets Indian spices" width={900} height={506} className="h-full w-full object-cover" />
          </div>
          <div className="absolute -inset-8 -z-10 rounded-full bg-gradient-to-tr from-orange/30 to-lightgreen/30 opacity-60 blur-3xl" />
        </motion.div>
        <motion.div {...REVEAL} className="relative z-20 max-w-lg px-4">
          <p className="mb-6 font-body text-base leading-relaxed text-gray-700 md:text-xl">
            A harmonious blend where the earthy richness of <span className="font-semibold text-darkgreen">Yerba Mate</span>{" "}
            meets the warming embrace of <span className="font-semibold text-orange">Masala spices</span>.
          </p>
          
        </motion.div>
      </div>
    </section>
  );
}

/* ---- 4. How To Prepare (6 videos; desktop grid + mobile slider) ---- */
const STEPS = [
  { title: "Fill the Gourd", description: "Fill the gourd (cup) halfway with yerba mate.", video: "/wim/step1.mp4" },
  { title: "Shake & Tilt", description: "Cover the mouth, turn it over and shake to even out the consistency.", video: "/wim/step2.mp4" },
  { title: "Insert Bombilla", description: "Keep the leaves at a 45° angle so there's space for the bombilla and water.", video: "/wim/step3.mp4" },
  { title: "Pour Cool Water", description: "Gently pour room-temperature water first to protect the leaves.", video: "/wim/step4.mp4" },
  { title: "Add Hot Water", description: "Pour hot — not boiling — water, around 70–80°C, into the cup.", video: "/wim/step5.mp4" },
  { title: "Enjoy & Share", description: "Sip until finished, refill, and pass it to a friend.", video: "/wim/step6.mp4" },
];

const NEEDS = [
  ["Yerba Mate", "Loose leaf"],
  ["Gourd", "Or a mason jar / ceramic cup"],
  ["Cool Water", "Room temperature"],
  ["Hot Water", "70–80°C, not boiling"],
  ["Bombilla", "Filtered metal straw"],
];

export function HowToPrepare() {
  const [slide, setSlide] = useState(0);
  return (
    <section className="bg-[#FDFBF7] px-4 py-16 nav:px-8">
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-12 text-center">
          <h2 className="mb-3 font-heading text-2xl font-extrabold text-darkgreen md:text-4xl">How To Prepare Yerba Mate</h2>
          <p className="mx-auto max-w-2xl font-body text-lg font-medium text-gray-600">
            For a traditional yerba mate experience, follow the steps below.
          </p>
        </div>

        <div className="flex flex-col items-start gap-12 xl:flex-row">
          {/* What you'll need */}
          <div className="order-2 w-full rounded-3xl border border-gray-100 bg-white p-8 shadow-sm xl:order-1 xl:sticky xl:top-24 xl:w-1/4">
            <h3 className="mb-6 border-b border-gray-100 pb-4 font-heading text-xl font-bold tracking-wider text-darkgreen">
              WHAT YOU&apos;LL NEED
            </h3>
            <ul className="space-y-5">
              {NEEDS.map(([name, sub]) => (
                <li key={name} className="flex flex-col">
                  <span className="font-body text-lg font-bold text-gray-800">{name}</span>
                  <span className="font-body text-sm text-gray-500">{sub}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Steps — desktop grid */}
          <div className="order-1 hidden w-full grid-cols-2 gap-6 xl:order-2 xl:grid xl:w-3/4 xl:grid-cols-3">
            {STEPS.map((s, i) => (
              <StepCard key={s.title} step={s} n={i + 1} />
            ))}
          </div>

          {/* Steps — mobile slider */}
          <div className="order-1 w-full xl:hidden">
            <StepCard step={STEPS[slide]} n={slide + 1} />
            <div className="mt-4 flex items-center justify-center gap-4">
              <button type="button" aria-label="Previous step" onClick={() => setSlide((s) => (s === 0 ? STEPS.length - 1 : s - 1))} className="grid h-10 w-10 place-items-center rounded-full bg-white text-darkgreen shadow hover:text-orange">
                <ChevronLeftIcon size={18} />
              </button>
              <div className="flex gap-1.5">
                {STEPS.map((_, i) => (
                  <span key={i} className={`h-2 rounded-full transition-all ${i === slide ? "w-5 bg-green" : "w-2 bg-gray-300"}`} />
                ))}
              </div>
              <button type="button" aria-label="Next step" onClick={() => setSlide((s) => (s === STEPS.length - 1 ? 0 : s + 1))} className="grid h-10 w-10 place-items-center rounded-full bg-white text-darkgreen shadow hover:text-orange">
                <ChevronRightIcon size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function StepCard({ step, n }: { step: (typeof STEPS)[number]; n: number }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
      <div className="relative aspect-square bg-gray-100">
        <video src={step.video} muted loop autoPlay playsInline className="h-full w-full object-cover" />
        <span className="absolute left-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-green font-body text-sm font-bold text-white">
          {n}
        </span>
      </div>
      <div className="p-5">
        <h3 className="mb-1 font-heading text-lg font-bold text-darkgreen">{step.title}</h3>
        <p className="font-body text-sm text-gray-600">{step.description}</p>
      </div>
    </div>
  );
}

/* ---- 5. Quote parallax ---- */
export function QuoteParallax({
  quote = "A Sip From Nature, A Taste Of Cultures",
  author = "MATESSA",
}: {
  quote?: string;
  author?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-10px", "10px"]);

  return (
    <section ref={ref} aria-label="Quote" className="relative w-full overflow-hidden" style={{ minHeight: 240 }}>
      <motion.div
        aria-hidden="true"
        className="absolute inset-0 bg-cover bg-center"
        style={{
          y,
          backgroundImage: "url('/wim/zoomedleaf.webp')",
          filter: "grayscale(0.2) saturate(0.9) brightness(0.88) contrast(1.05)",
        }}
      />
      <div className="absolute inset-0" style={{ backgroundColor: "rgba(15,35,20,0.55)" }} />
      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:py-28">
        <motion.blockquote {...REVEAL} className="mx-auto max-w-3xl text-center">
          <p className="font-heading text-2xl leading-tight text-white drop-shadow-sm sm:text-3xl lg:text-4xl">“{quote}”</p>
          <footer className="mt-4 font-body text-sm text-yellow sm:text-base">{author}</footer>
        </motion.blockquote>
      </div>
    </section>
  );
}
