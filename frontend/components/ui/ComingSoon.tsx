import Link from "next/link";

/** Phase-0 placeholder for routes that haven't been rebuilt yet.
 *  Every stub page renders this so nav links never 404 mid-rebuild. */
export function ComingSoon({ title }: { title: string }) {
  return (
    <main className="min-h-[70svh] grid place-items-center bg-white px-6">
      <div className="text-center max-w-md">
        <p className="font-body text-sm uppercase tracking-[0.2em] text-lightgreen mb-3">Matessa</p>
        <h1 className="font-heading font-bold text-3xl text-darkgreen mb-3">{title}</h1>
        <p className="text-gray-600 mb-8">
          This page is being brewed. It will be ready shortly.
        </p>
        <Link
          href="/"
          className="inline-block rounded-full bg-green px-7 py-3 font-body font-bold text-white transition-colors duration-300 hover:bg-orange"
        >
          Back to Home
        </Link>
      </div>
    </main>
  );
}
