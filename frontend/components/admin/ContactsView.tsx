"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { EmptyBlock, StatusBadge } from "./ui";
import { AdminPager } from "./AdminPager";
import { api, ApiError } from "@/lib/api";
import type { ContactQueryResponse } from "@/lib/api";
import type { ContactQueriesPage, SubscribersPage } from "@/lib/server/contacts";

const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
};

export function ContactsView({
  tab,
  queries,
  subscribers,
}: {
  tab: "queries" | "subscribers";
  queries: ContactQueriesPage;
  subscribers: SubscribersPage;
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const toggleStatus = async (q: ContactQueryResponse) => {
    setError(null);
    setBusyId(q.id);
    try {
      await api.contact.setStatus(q.id, q.status === "OPEN" ? "RESOLVED" : "OPEN");
      router.refresh();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Couldn't update the query. Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="adm-content">
      <div className="page-head">
        <div className="ttl">
          <p>Customer support queries and newsletter subscribers.</p>
        </div>
      </div>

      <div className="filter-row" role="tablist" aria-label="Contacts sections">
        <Link
          className={`f-chip${tab === "queries" ? " is-active" : ""}`}
          href="/admin/contacts?tab=queries"
          role="tab"
          aria-selected={tab === "queries"}
        >
          Support queries
        </Link>
        <Link
          className={`f-chip${tab === "subscribers" ? " is-active" : ""}`}
          href="/admin/contacts?tab=subscribers"
          role="tab"
          aria-selected={tab === "subscribers"}
        >
          Subscribers
        </Link>
      </div>

      {error && (
        <p role="alert" style={{ color: "#f87171", fontSize: 13, margin: "0 0 12px" }}>
          {error}
        </p>
      )}

      {tab === "queries" ? (
        <div className="card">
          <div className="card-head">
            <h3>Support queries</h3>
            <span className="sub">{queries.total} total</span>
          </div>
          {queries.items.length === 0 ? (
            <EmptyBlock title="No queries yet">
              Messages from the storefront contact form appear here.
            </EmptyBlock>
          ) : (
            <div className="tbl-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>From</th>
                    <th>Query</th>
                    <th>Message</th>
                    <th>Status</th>
                    <th>Received</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {queries.items.map((q) => (
                    <tr key={q.id}>
                      <td className="mono" style={{ fontSize: 11.5 }}>{q.email}</td>
                      <td>{q.queryType}</td>
                      <td className="muted" style={{ maxWidth: 340, whiteSpace: "normal" }}>{q.message}</td>
                      <td><StatusBadge value={q.status} /></td>
                      <td className="muted">{fmtDate(q.createdAt)}</td>
                      <td>
                        <button
                          type="button"
                          className="f-chip"
                          style={{ cursor: "pointer", whiteSpace: "nowrap" }}
                          disabled={busyId === q.id}
                          onClick={() => toggleStatus(q)}
                        >
                          {q.status === "OPEN" ? "Resolve" : "Reopen"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <AdminPager
            page={queries.page}
            totalPages={queries.totalPages}
            total={queries.total}
            size={20}
            basePath="/admin/contacts"
            params={{ tab: "queries" }}
          />
        </div>
      ) : (
        <div className="card">
          <div className="card-head">
            <h3>Newsletter subscribers</h3>
            <span className="sub">{subscribers.total} total</span>
          </div>
          {subscribers.items.length === 0 ? (
            <EmptyBlock title="No subscribers yet">
              Emails captured by the storefront popup appear here, each with its welcome coupon.
            </EmptyBlock>
          ) : (
            <div className="tbl-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Welcome coupon</th>
                    <th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {subscribers.items.map((s) => (
                    <tr key={s.id}>
                      <td>{s.email}</td>
                      <td className="mono">{s.couponCode ?? "—"}</td>
                      <td className="muted">{fmtDate(s.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <AdminPager
            page={subscribers.page}
            totalPages={subscribers.totalPages}
            total={subscribers.total}
            size={20}
            basePath="/admin/contacts"
            params={{ tab: "subscribers" }}
          />
        </div>
      )}
    </div>
  );
}
