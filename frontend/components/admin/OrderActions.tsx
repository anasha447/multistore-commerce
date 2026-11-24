"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import type { OrderStatus } from "@/lib/api";
import { icons } from "./icons";
import { Modal } from "./Modal";

// Backend transitions stay PENDING→PAID→SHIPPED→DELIVERED (order-service is strict);
// the labels present the friendlier journey Placed → Dispatched → In transit → Delivered.
const NEXT: Partial<Record<OrderStatus, OrderStatus>> = {
  PENDING: "PAID",
  PAID: "SHIPPED",
  SHIPPED: "DELIVERED",
};
const ADVANCE_LABEL: Partial<Record<OrderStatus, string>> = {
  PENDING: "Mark dispatched",
  PAID: "Mark in transit",
  SHIPPED: "Mark delivered",
};

export function OrderActions({
  orderId,
  orderNumber,
  status,
  paymentStatus,
  shippingMethod,
  trackingNumber,
}: {
  orderId: number;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: string;
  shippingMethod: string | null;
  trackingNumber: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shipOpen, setShipOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [method, setMethod] = useState(shippingMethod ?? "");
  const [tracking, setTracking] = useState(trackingNumber ?? "");

  const next = NEXT[status];
  const canCancel = status === "PENDING" || status === "PAID";

  const run = async (fn: () => Promise<unknown>, done?: () => void) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
      done?.();
      router.refresh();
    } catch (e) {
      setError(
        e instanceof ApiError
          ? e.isConflict
            ? "That action isn't allowed for this order's current state."
            : e.message
          : "Something went wrong — please try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Link className="btn btn-outline btn-sm" href="/admin/orders">
          {icons.chevL} All orders
        </Link>
        {next && (
          <button
            className="btn btn-primary btn-sm"
            type="button"
            disabled={busy}
            onClick={() => run(() => api.orders.updateStatus(orderId, { status: next }))}
          >
            {ADVANCE_LABEL[status]} {icons.arrowR}
          </button>
        )}
        <button
          className="btn btn-outline btn-sm"
          type="button"
          disabled={busy}
          onClick={() => setShipOpen(true)}
        >
          {icons.truck} Shipping
        </button>
        {canCancel && (
          <button
            className="btn btn-danger btn-sm"
            type="button"
            disabled={busy}
            onClick={() => setCancelOpen(true)}
          >
            Cancel order
          </button>
        )}
      </div>
      {error && (
        <p className="co-error" style={{ marginTop: 8 }}>
          {error}
        </p>
      )}

      {shipOpen && (
        <Modal
          title="Update shipping"
          onClose={() => setShipOpen(false)}
          footer={
            <>
              <button className="btn btn-outline" type="button" onClick={() => setShipOpen(false)}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                type="button"
                disabled={busy || !method.trim()}
                onClick={() =>
                  run(
                    () =>
                      api.orders.updateShipping(orderId, {
                        shippingMethod: method.trim(),
                        trackingNumber: tracking.trim() || null,
                      }),
                    () => setShipOpen(false),
                  )
                }
              >
                Save
              </button>
            </>
          }
        >
          <div className="field">
            <label>Shipping method</label>
            <input
              className="text-input"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              placeholder="Standard / Express"
            />
          </div>
          <div className="field">
            <label>Tracking number</label>
            <input
              className="text-input"
              value={tracking}
              onChange={(e) => setTracking(e.target.value)}
              placeholder="Optional"
            />
          </div>
        </Modal>
      )}

      {cancelOpen && (
        <Modal
          title="Cancel this order?"
          onClose={() => setCancelOpen(false)}
          footer={
            <>
              <button className="btn btn-outline" type="button" onClick={() => setCancelOpen(false)}>
                Keep order
              </button>
              <button
                className="btn btn-danger"
                type="button"
                disabled={busy}
                onClick={() => run(() => api.orders.cancel(orderId), () => setCancelOpen(false))}
              >
                Cancel order
              </button>
            </>
          }
        >
          <p style={{ fontSize: 14.5, lineHeight: 1.55 }}>
            {orderNumber} will be cancelled
            {paymentStatus === "COMPLETED" ? " and the payment refunded" : ""}. Orders already
            in transit can&apos;t be cancelled (the API returns 409).
          </p>
        </Modal>
      )}
    </>
  );
}
