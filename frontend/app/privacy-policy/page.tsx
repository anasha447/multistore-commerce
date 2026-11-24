import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";

export const metadata: Metadata = {
  title: "Privacy Policy — Matessa",
  description: "How Matessa collects, uses, and protects your personal information.",
};

const UPDATED = "20 July 2026";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="font-heading text-xl font-bold text-darkgreen md:text-2xl">{title}</h2>
      <div className="mt-3 space-y-3 font-body text-[15px] leading-relaxed text-gray-600">{children}</div>
    </section>
  );
}

export default function PrivacyPolicyPage() {
  return (
    <>
      <SiteHeader />
      <main className="min-h-[70svh] bg-white">
        <div className="mx-auto max-w-3xl px-5 py-12 nav:px-8 nav:py-16">
          <h1 className="font-heading text-3xl font-bold text-darkgreen md:text-4xl">Privacy Policy</h1>
          <p className="mt-2 font-body text-sm text-gray-500">Last updated: {UPDATED}</p>
          <p className="mt-6 font-body text-[15px] leading-relaxed text-gray-600">
            This policy explains what information Matessa collects when you browse our store or place an
            order, how we use it, and the choices you have. We keep it deliberately short and plain.
          </p>

          <Section title="Information we collect">
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong className="text-darkgreen">Account details</strong> — your name, email address and
                (optionally) a phone number, when you create an account.
              </li>
              <li>
                <strong className="text-darkgreen">Order details</strong> — the shipping address you enter at
                checkout, the items you buy, and your order history.
              </li>
              <li>
                <strong className="text-darkgreen">Support messages</strong> — the email address and message you
                send through our contact form.
              </li>
              <li>
                <strong className="text-darkgreen">Technical data</strong> — cookies that keep you signed in and
                remember your cart, plus basic logs used to keep the site running and secure.
              </li>
            </ul>
          </Section>

          <Section title="How we use it">
            <p>
              We use your information to process and deliver your orders, provide customer support, keep your
              account secure, and — only if you opt in — send occasional updates about new blends. We do not
              sell your personal information.
            </p>
          </Section>

          <Section title="Payments">
            <p>
              Payments are handled by our payment provider. Matessa does not store your full card details on
              our servers; we only keep a transaction reference so we can match a payment to your order.
            </p>
          </Section>

          <Section title="Cookies">
            <p>
              We use a small number of essential cookies: one to keep you signed in, and one to remember the
              items in your cart. Clearing your browser storage will sign you out and empty your guest cart.
            </p>
          </Section>

          <Section title="Sharing">
            <p>
              We share only what is needed to run the store — for example your address with the courier that
              delivers your order, and your payment reference with our payment provider. We may also disclose
              information where required by law.
            </p>
          </Section>

          <Section title="Keeping your data">
            <p>
              We keep order records for as long as needed for accounting and warranty purposes. You can ask us
              to delete your account at any time; we will remove your personal details and retain only the
              minimum required for legal and financial records.
            </p>
          </Section>

          <Section title="Your choices">
            <p>
              You can view and update your name, phone number and password from your{" "}
              <Link href="/account" className="font-bold text-green hover:text-orange">
                account page
              </Link>
              , unsubscribe from marketing email at any time, and request a copy or deletion of your data by
              contacting us.
            </p>
          </Section>

          <Section title="Contact">
            <p>
              Questions about this policy? Email{" "}
              <a href="mailto:support@matessa.in" className="font-bold text-green hover:text-orange">
                support@matessa.in
              </a>{" "}
              or use our{" "}
              <Link href="/contact" className="font-bold text-green hover:text-orange">
                contact form
              </Link>
              . Matessa, Lucknow, India.
            </p>
          </Section>
        </div>
      </main>
      <SiteFooter variant="full" />
    </>
  );
}
