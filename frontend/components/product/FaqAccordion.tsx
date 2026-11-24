"use client";

// PDP FAQ accordion (design: Product Page.dc.html §FAQ) — the 8 design Q&As,
// single-open, chevron rotates.
import { useState } from "react";
import Link from "next/link";
import { ChevronRightIcon } from "@/components/ui/icons";

const FAQS: [string, string][] = [
  [
    "How much caffeine is in yerba mate?",
    "Around 80–85 mg per serving — comparable to a light coffee, but delivered with theobromine for a smooth, sustained \"mateine\" energy with no crash.",
  ],
  [
    "Where is your yerba mate sourced from?",
    "From elite Argentine farms where the leaf grows rainforest-shaded, then hand-blended in small batches for Matessa.",
  ],
  [
    "Why shouldn't I use boiling water?",
    "Boiling water burns the leaves and turns the cup bitter. Use water at 70–80°C for a sweet, balanced brew.",
  ],
  [
    "What does Matessa taste like?",
    "Masala Mate is warming and spiced; Lemon & Ginger is bright and zesty; Raw Mate is the original grassy, earthy cup.",
  ],
  [
    "Is yerba mate suitable for my diet?",
    "Yes — 100% natural, vegan, gluten-free, keto-friendly, zero sugar, and fasting-friendly.",
  ],
  [
    "Do I need a bombilla to drink it?",
    "For the authentic ritual, yes — gourd and bombilla. But mate also brews beautifully in a French press or any infuser.",
  ],
  ["How many times can I refill the gourd?", "Up to 10 refills from a single serving of leaves — that's the tradition."],
  [
    "Can I brew it with milk?",
    "Yes — \"mate de leche\". Brew Raw Mate strong, add warm milk and a little honey.",
  ],
];

export function FaqAccordion() {
  const [openI, setOpenI] = useState<number | null>(null);
  return (
    <section id="faq" className="mx-auto max-w-3xl px-6 py-14">
      <h2 className="mb-8 text-center font-heading text-3xl font-bold text-darkgreen">Questions, Answered</h2>
      <div className="divide-y divide-gray-200 rounded-[22px] bg-white px-6 shadow-lg">
        {FAQS.map(([q, a], i) => {
          const open = openI === i;
          return (
            <div key={q}>
              <button
                type="button"
                aria-expanded={open}
                onClick={() => setOpenI(open ? null : i)}
                className="flex w-full items-center justify-between gap-4 py-5 text-left font-body font-bold text-darkgreen transition-colors hover:text-orange"
              >
                {q}
                <span className={`shrink-0 transition-transform duration-300 ${open ? "rotate-90" : ""}`}>
                  <ChevronRightIcon size={18} />
                </span>
              </button>
              <div
                className="grid transition-all duration-300"
                style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
              >
                <div className="overflow-hidden">
                  <p className="pb-5 text-[15px] text-gray-600">{a}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-6 text-center font-body text-sm text-gray-500">
        Still have questions?{" "}
        <Link href="/contact" className="font-bold text-green transition-colors hover:text-orange">
          Chat with us
        </Link>
      </p>
    </section>
  );
}
