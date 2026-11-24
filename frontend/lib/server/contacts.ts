// Server-side admin fetch (cookie session) for contact queries + newsletter subscribers.
// Both are staff-only (MANAGER/ADMIN) reads, served by commercial-service.
import { serverGet } from "./session";
import type { ContactQueryResponse, Page, SubscriberResponse } from "@/lib/api";

export interface ContactQueriesPage {
  items: ContactQueryResponse[];
  total: number;
  page: number;
  totalPages: number;
}

export interface SubscribersPage {
  items: SubscriberResponse[];
  total: number;
  page: number;
  totalPages: number;
}

export async function getContactQueries(
  opts: { page?: number; size?: number } = {},
): Promise<ContactQueriesPage> {
  const size = opts.size ?? 20;
  const page = opts.page ?? 0;
  const data = await serverGet<Page<ContactQueryResponse>>(
    `/api/contact?page=${page}&size=${size}`,
  );
  return {
    items: data?.content ?? [],
    total: data?.page.totalElements ?? 0,
    page: data?.page.number ?? page,
    totalPages: data?.page.totalPages ?? 1,
  };
}

export async function getSubscribers(
  opts: { page?: number; size?: number } = {},
): Promise<SubscribersPage> {
  const size = opts.size ?? 20;
  const page = opts.page ?? 0;
  const data = await serverGet<Page<SubscriberResponse>>(
    `/api/subscribers?page=${page}&size=${size}`,
  );
  return {
    items: data?.content ?? [],
    total: data?.page.totalElements ?? 0,
    page: data?.page.number ?? page,
    totalPages: data?.page.totalPages ?? 1,
  };
}
