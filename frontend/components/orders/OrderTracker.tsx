import type { OrderStatus } from "@/lib/api";
import { ORDER_JOURNEY, ORDER_STATUS_LABEL, orderJourneyIndex } from "@/lib/utils/orderStatus";

function Check({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Horizontal 4-step fulfilment tracker: Placed → Dispatched → In transit → Delivered.
// Cancelled orders show a dedicated notice instead of the journey.
export function OrderTracker({ status }: { status: OrderStatus }) {
  if (status === "CANCELLED") {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-center font-body text-sm font-bold text-red-600">
        This order was cancelled.
      </div>
    );
  }

  const current = Math.max(0, orderJourneyIndex(status));

  return (
    <ol className="flex items-start" aria-label="Order progress">
      {ORDER_JOURNEY.map((s, i) => {
        const done = i < current;
        const active = i === current;
        const reached = i <= current;
        return (
          <li key={s} className="relative flex flex-1 flex-col items-center">
            {/* connector to the previous step */}
            {i > 0 && (
              <span
                aria-hidden
                className={`absolute right-1/2 top-4 h-[3px] w-full -translate-y-1/2 ${
                  i <= current ? "bg-green" : "bg-gray-200"
                }`}
              />
            )}
            <span
              className={`relative z-[1] grid h-8 w-8 place-items-center rounded-full border-2 font-body text-xs font-bold transition-colors ${
                done
                  ? "border-green bg-green text-white"
                  : active
                    ? "border-orange bg-white text-orange ring-4 ring-orange/15"
                    : "border-gray-300 bg-white text-gray-400"
              }`}
            >
              {done ? <Check size={16} /> : i + 1}
            </span>
            <span
              className={`mt-2 text-center font-body text-[11px] font-bold leading-tight nav:text-xs ${
                reached ? "text-darkgreen" : "text-gray-400"
              }`}
            >
              {ORDER_STATUS_LABEL[s]}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
