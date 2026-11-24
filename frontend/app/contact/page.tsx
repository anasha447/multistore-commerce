import type { Metadata } from "next";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { ContactForm } from "@/components/contact/ContactForm";

export const metadata: Metadata = {
  title: "Contact Us — Matessa",
  description: "Questions about orders, brewing, or wholesale? Get in touch with the Matessa team.",
};

export default function ContactPage() {
  return (
    <>
      <SiteHeader />
      <main className="grid min-h-[70svh] place-items-center px-5 py-14">
        <ContactForm />
      </main>
      <SiteFooter variant="full" />
    </>
  );
}
