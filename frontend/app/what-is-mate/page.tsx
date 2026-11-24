import type { Metadata } from "next";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { WorldConsumptionMap } from "@/components/what-is-mate/WorldConsumptionMap";
import {
  WhatIsMateIntro,
  MateTimeline,
  IndianMateStory,
  HowToPrepare,
  QuoteParallax,
} from "@/components/what-is-mate/WhatIsMateSections";

export const metadata: Metadata = {
  title: "What is Mate?! — Matessa",
  description:
    "Explore yerba mate — from its ancient South American roots to its arrival in India. The timeline, the world map, the ritual and the health.",
};

export default function WhatIsMatePage() {
  return (
    <>
      <SiteHeader />
      <main className="bg-white">
        <WhatIsMateIntro />
        <MateTimeline />
        <h1 className="py-2 text-center font-heading text-xl font-bold text-black md:text-3xl">
          Yerba Mate Consumption Map
        </h1>
        <WorldConsumptionMap />
        <IndianMateStory />
        <HowToPrepare />
      </main>
      <SiteFooter variant="full" />
    </>
  );
}
