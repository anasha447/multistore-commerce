import type { OrderStatus } from "@/lib/api";

// Customer-facing fulfilment labels. The backend enum stays PENDING/PAID/SHIPPED/
// DELIVERED/CANCELLED (order-service is authoritative and its transition machine is
// strict), but both the storefront and the admin present the journey with friendlier
// names: Placed → Dispatched → In transit → Delivered.
export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: "Placed",
  PAID: "Dispatched",
  SHIPPED: "In transit",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export function orderStatusLabel(status: string): string {
  return ORDER_STATUS_LABEL[status as OrderStatus] ?? status;
}

// The ordered fulfilment journey shown in trackers/steppers (excludes CANCELLED).
export const ORDER_JOURNEY: OrderStatus[] = ["PENDING", "PAID", "SHIPPED", "DELIVERED"];

/** Index of a status within the journey; DELIVERED = last. Non-journey → -1. */
export function orderJourneyIndex(status: string): number {
  return ORDER_JOURNEY.indexOf(status as OrderStatus);
}
