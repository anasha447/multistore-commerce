"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EmptyBlock, StatusBadge } from "./ui";
import { icons } from "./icons";
import { CouponModal } from "./CouponModal";
import { DiscountModal } from "./DiscountModal";
import { api } from "@/lib/api";
import { formatMoney } from "@/lib/utils/money";
import type { CouponResponse } from "@/lib/api";
import type { DiscountRow, PromotionsData } from "@/lib/server/promotions";

const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" });
};

function couponStateClient(c: CouponResponse): string {
  if (!c.active) return "INACTIVE";
  if (new Date(c.validUntil) < new Date()) return "EXPIRED";
  if (c.maxUses != null && c.usedCount >= c.maxUses) return "EXHAUSTED";
  return "ACTIVE";
}

export function PromotionsView({ data }: { data: PromotionsData }) {
  const router = useRouter();
  const [couponModal, setCouponModal] = useState<{ initial: CouponResponse | null } | null>(null);
  const [discountModal, setDiscountModal] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  const refresh = () => router.refresh();
  const closeAndRefresh = () => {
    setCouponModal(null);
    setDiscountModal(false);
    refresh();
  };

  const toggleCoupon = async (c: CouponResponse) => {
    setBusyId(c.id);
    try {
      await api.coupons.update(c.id, {
        code: c.code,
        discountType: c.discountType,
        discountValue: c.discountValue,
        minSpend: c.minSpend,
        maxUses: c.maxUses,
        perUserLimit: c.perUserLimit,
        validFrom: c.validFrom,
        validUntil: c.validUntil,
        active: !c.active,
      });
      refresh();
    } finally {
      setBusyId(null);
    }
  };

  const deleteDiscount = async (d: DiscountRow) => {
    if (!window.confirm(`Delete the ${d.scope.toLowerCase()} discount on ${d.targetName}?`)) return;
    setBusyId(d.id);
    try {
      await api.discounts.remove(d.id);
      refresh();
    } finally {
      setBusyId(null);
    }
  };

  const activeCoupons = data.coupons.filter((c) => couponStateClient(c) === "ACTIVE").length;
  const activeDiscounts = data.discounts.filter((d) => d.active).length;

  return (
    <div className="adm-content">
      <div className="page-head">
        <div className="ttl">
          <p>Coupons customers type at checkout, and automatic markdowns on products or categories.</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-outline" type="button" onClick={() => setDiscountModal(true)}>
            {icons.plus} New discount
          </button>
          <button className="btn btn-primary" type="button" onClick={() => setCouponModal({ initial: null })}>
            {icons.plus} New coupon
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h3>Coupons</h3>
          <span className="sub">{activeCoupons} active</span>
        </div>
        {data.coupons.length === 0 ? (
          <EmptyBlock title="No coupons yet">Create a code customers can enter at checkout.</EmptyBlock>
        ) : (
          <div className="tbl-wrap" style={{ marginTop: 10 }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Discount</th>
                  <th>Min spend</th>
                  <th>Usage</th>
                  <th>Per user</th>
                  <th>Validity</th>
                  <th>Status</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {data.coupons.map((c) => {
                  const pct = c.maxUses != null ? Math.min(100, (c.usedCount / c.maxUses) * 100) : null;
                  return (
                    <tr key={c.id}>
                      <td className="id-cell" style={{ fontWeight: 600 }}>{c.code}</td>
                      <td className="money" style={{ color: "var(--accent)" }}>
                        {c.discountType === "PERCENTAGE" ? `${c.discountValue}%` : formatMoney(c.discountValue)}
                      </td>
                      <td className="muted">{c.minSpend > 0 ? formatMoney(c.minSpend) : "—"}</td>
                      <td style={{ minWidth: 130 }}>
                        <span className="mono" style={{ fontSize: 12 }}>
                          {c.usedCount}
                          {c.maxUses != null ? ` / ${c.maxUses}` : ""}
                        </span>
                        {pct != null && (
                          <span style={{ display: "block", height: 4, background: "var(--bg-raised)", borderRadius: 2, marginTop: 4, overflow: "hidden" }}>
                            <span style={{ display: "block", height: "100%", width: `${pct}%`, background: pct >= 100 ? "var(--warning)" : "var(--cool)" }} />
                          </span>
                        )}
                      </td>
                      <td className="muted mono" style={{ fontSize: 12 }}>{c.perUserLimit || "—"}</td>
                      <td className="muted mono" style={{ fontSize: 11.5 }}>
                        {fmtDate(c.validFrom)} → {fmtDate(c.validUntil)}
                      </td>
                      <td>
                        <StatusBadge value={couponStateClient(c)} />
                      </td>
                      <td className="num" style={{ whiteSpace: "nowrap" }}>
                        <button className="icon-btn" type="button" aria-label={`Edit ${c.code}`} onClick={() => setCouponModal({ initial: c })}>
                          {icons.edit}
                        </button>{" "}
                        <button
                          className="icon-btn is-danger"
                          type="button"
                          aria-label={`${c.active ? "Deactivate" : "Activate"} ${c.code}`}
                          disabled={busyId === c.id}
                          onClick={() => toggleCoupon(c)}
                        >
                          {icons.trash}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-head">
          <h3>Automatic discounts</h3>
          <span className="sub">{activeDiscounts} active</span>
        </div>
        {data.discounts.length === 0 ? (
          <EmptyBlock title="No discounts running">
            Create a markdown on a product or category — it applies automatically, no code needed.
          </EmptyBlock>
        ) : (
          <div className="tbl-wrap" style={{ marginTop: 10 }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Target</th>
                  <th>Scope</th>
                  <th>Discount</th>
                  <th>Validity</th>
                  <th>Status</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {data.discounts.map((d) => (
                  <tr key={d.id}>
                    <td style={{ fontWeight: 600 }}>{d.targetName}</td>
                    <td>
                      <span className={`st-badge ${d.productId != null ? "st-shipped" : "st-neutral"}`}>{d.scope}</span>
                    </td>
                    <td className="money" style={{ color: "var(--accent)" }}>
                      {d.type === "PERCENTAGE" ? `${d.value}% off` : `${formatMoney(d.value)} off`}
                    </td>
                    <td className="muted mono" style={{ fontSize: 11.5 }}>
                      {fmtDate(d.validFrom)} → {fmtDate(d.validTo)}
                    </td>
                    <td>
                      <StatusBadge value={d.active ? "ACTIVE" : "INACTIVE"} />
                    </td>
                    <td className="num">
                      <button
                        className="icon-btn is-danger"
                        type="button"
                        aria-label="Delete discount"
                        disabled={busyId === d.id}
                        onClick={() => deleteDiscount(d)}
                      >
                        {icons.trash}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {couponModal && (
        <CouponModal initial={couponModal.initial} onClose={() => setCouponModal(null)} onSaved={closeAndRefresh} />
      )}
      {discountModal && (
        <DiscountModal
          products={data.products}
          categories={data.categories}
          onClose={() => setDiscountModal(false)}
          onSaved={closeAndRefresh}
        />
      )}
    </div>
  );
}
