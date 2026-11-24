"use client";

// PDP reviews — live data replacing the design's static "4.8 · 120+ reviews".
// Lists reviews (public) and lets signed-in customers submit one (server enforces
// one review per user per product → 409 handled).

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { ReviewResponse } from "@/lib/api";
import { StarIcon } from "@/components/ui/icons";

export function Stars({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex gap-0.5 text-lightgreen" aria-label={`${value.toFixed(1)} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((s) => (
        <StarIcon key={s} size={size} filled={s <= Math.round(value)} />
      ))}
    </span>
  );
}

export function ReviewsSection({
  productId,
  authed,
  canReview,
}: {
  productId: number;
  authed: boolean;
  /** true only when the signed-in customer has a delivered order with this product. */
  canReview: boolean;
}) {
  const [reviews, setReviews] = useState<ReviewResponse[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    let on = true;
    api.reviews
      .list(productId, { size: 10, sort: "createdAt,desc" })
      .then((page) => on && setReviews(page.content))
      .catch(() => {})
      .finally(() => on && setLoaded(true));
    return () => {
      on = false;
    };
  }, [productId]);

  const submit = async () => {
    if (!text.trim()) {
      setMsg("Tell us a little about your cup first.");
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const created = await api.reviews.create(productId, { rating, text: text.trim() });
      setReviews((r) => [created, ...r]);
      setText("");
      setMsg("Thanks — your review is live.");
    } catch (e) {
      if (e instanceof ApiError && e.isConflict) setMsg("You've already reviewed this blend.");
      else if (e instanceof ApiError && e.isUnauthorized) setMsg("Please sign in to review.");
      else setMsg("Couldn't submit right now — please try again.");
    } finally {
      setBusy(false);
    }
  };

  const canWrite = authed && canReview;

  // Nothing to say yet: no reviews and this visitor can't write one → render nothing
  // (no "From Fellow Sippers" heading, no sign-in prompt, no empty-state copy).
  if (!loaded || (reviews.length === 0 && !canWrite)) return null;

  return (
    <section aria-label="Reviews" className="mx-auto max-w-3xl px-6 py-10">
      {reviews.length > 0 && (
        <h2 className="mb-6 text-center font-heading text-3xl font-bold text-darkgreen">From Fellow Sippers</h2>
      )}

      {canWrite ? (
        <div className="mb-8 rounded-[22px] bg-white p-5 shadow-lg">
          <div className="mb-3 flex items-center gap-2">
            <span className="font-body text-sm font-bold text-darkgreen">Your rating</span>
            <span className="inline-flex gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  aria-label={`${s} star${s === 1 ? "" : "s"}`}
                  aria-pressed={s === rating}
                  onClick={() => setRating(s)}
                  className={s <= rating ? "text-lightgreen" : "text-gray-300"}
                >
                  <StarIcon size={20} filled={s <= rating} />
                </button>
              ))}
            </span>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            placeholder="Great for work sessions, keeps me focused…"
            aria-label="Your review"
            className="w-full rounded-2xl border border-gray-200 p-3 font-body text-[15px] outline-none focus:border-green"
          />
          <div className="mt-3 flex items-center justify-between gap-3">
            {msg && <p className="font-body text-sm text-green">{msg}</p>}
            <button
              type="button"
              disabled={busy}
              onClick={submit}
              className="ml-auto rounded-full bg-green px-6 py-2.5 font-body text-sm font-bold text-white transition-colors hover:bg-orange disabled:opacity-40"
            >
              {busy ? "Posting…" : "Post review"}
            </button>
          </div>
        </div>
      ) : null}

      {reviews.length > 0 && (
        <ul className="space-y-4">
          {reviews.map((r) => (
            <li key={r.id} className="rounded-2xl bg-white p-5 shadow-lg">
              <div className="mb-1.5 flex items-center justify-between">
                <Stars value={r.rating} />
                <span className="font-body text-xs text-gray-400">
                  {new Date(r.createdAt).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })}
                </span>
              </div>
              <p className="text-[15px] text-gray-600">{r.text}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
