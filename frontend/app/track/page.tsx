import type { Metadata } from "next";
import { Suspense } from "react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { TrackView } from "@/components/orders/TrackView";

export const metadata: Metadata = { title: "Track Order — Matessa" };

export default function TrackPage() {
  return (
    <>
      <SiteHeader />
      <main className="min-h-[70svh]">
        <Suspense fallback={null}>
          <TrackView />
        </Suspense>
      </main>
      <SiteFooter variant="full" />
    </>
  );
}
