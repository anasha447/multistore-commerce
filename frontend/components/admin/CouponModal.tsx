"use client";

import { useState } from "react";
import { Modal } from "./Modal";
import { Field } from "./ui";
import { api, ApiError } from "@/lib/api";
import type { CouponRequest, CouponResponse } from "@/lib/api";

const isoDay = (d: Date) => d.toISOString().slice(0, 10);

/** Create/edit a coupon. Validates client-side, then POST/PUT via the BFF. */
export function CouponModal({
  initial,
  onClose,
  onSaved,
}: {
  initial: CouponResponse | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  // New coupons default to a window starting today (a past validFrom is rejected
  // by the backend), running 90 days. The modal only mounts on a client click, so
  // reading the clock in the initializer can't cause a hydration mismatch.
  const [form, setForm] = useState(() => ({
    code: initial?.code ?? "",
    discountType: initial?.discountType ?? "PERCENTAGE",
    discountValue: initial?.discountValue?.toString() ?? "",
    minSpend: initial?.minSpend?.toString() ?? "",
    maxUses: initial?.maxUses?.toString() ?? "",
    perUserLimit: initial?.perUserLimit?.toString() ?? "1",
    validFrom: initial?.validFrom ? initial.validFrom.slice(0, 10) : isoDay(new Date()),
    validUntil: initial?.validUntil
      ? initial.validUntil.slice(0, 10)
      : isoDay(new Date(Date.now() + 90 * 86_400_000)),
    active: initial ? String(initial.active) : "true",
  }));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    const errs: Record<string, string> = {};
    if (!/^[A-Z0-9]{4,16}$/.test(form.code)) errs.code = "4–16 uppercase letters or digits.";
    if (!(Number(form.discountValue) > 0)) errs.discountValue = "Value must be positive.";
    if (form.discountType === "PERCENTAGE" && Number(form.discountValue) > 90)
      errs.discountValue = "Percentage capped at 90.";
    if (new Date(form.validUntil) <= new Date(form.validFrom)) errs.validUntil = "Must end after it starts.";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    const body: CouponRequest = {
      code: form.code,
      discountType: form.discountType as CouponRequest["discountType"],
      discountValue: Number(form.discountValue),
      minSpend: form.minSpend === "" ? 0 : Number(form.minSpend),
      // backend requires maxUses >= 1; blank / non-positive means unlimited → send null
      maxUses: Number(form.maxUses) >= 1 ? Number(form.maxUses) : null,
      perUserLimit: Number(form.perUserLimit) || 1,
      validFrom: `${form.validFrom}T00:00:00Z`,
      validUntil: `${form.validUntil}T23:59:59Z`,
      active: form.active === "true",
    };

    setBusy(true);
    try {
      if (initial) await api.coupons.update(initial.id, body);
      else await api.coupons.create(body);
      onSaved();
    } catch (e) {
      setErrors({
        code: e instanceof ApiError && e.isConflict ? "Code already exists (409)." : "",
        _form: e instanceof ApiError ? e.message : "Couldn't save the coupon.",
      });
      setBusy(false);
    }
  };

  return (
    <Modal
      title={initial ? "Edit coupon" : "New coupon"}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-outline" type="button" onClick={onClose} disabled={busy}>
            Discard
          </button>
          <button className="btn btn-primary" type="button" onClick={save} disabled={busy}>
            {busy ? "Saving…" : initial ? "Save changes" : "Create coupon"}
          </button>
        </>
      }
    >
      {errors._form && <p className="co-error">{errors._form}</p>}
      <Field label="Code" error={errors.code}>
        <input
          className="text-input mono-input"
          value={form.code}
          onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase().replace(/\s/g, "") }))}
          placeholder="TRAIL10"
        />
      </Field>
      <div className="field-row">
        <Field label="Type">
          <select className="text-input" value={form.discountType} onChange={set("discountType")}>
            <option value="PERCENTAGE">Percentage</option>
            <option value="FIXED_AMOUNT">Fixed amount</option>
          </select>
        </Field>
        <Field label={form.discountType === "PERCENTAGE" ? "Value (%)" : "Value (₹)"} error={errors.discountValue}>
          <input className="text-input" type="number" step="0.01" min="0" value={form.discountValue} onChange={set("discountValue")} />
        </Field>
      </div>
      <div className="field-row">
        <Field label="Min spend" hint="Blank = none.">
          <input className="text-input" type="number" min="0" value={form.minSpend} onChange={set("minSpend")} />
        </Field>
        <Field label="Max uses" hint="Blank = unlimited.">
          <input className="text-input" type="number" min="1" value={form.maxUses} onChange={set("maxUses")} />
        </Field>
      </div>
      <div className="field-row">
        <Field label="Per-user limit">
          <input className="text-input" type="number" min="1" value={form.perUserLimit} onChange={set("perUserLimit")} />
        </Field>
        <Field label="Active">
          <select className="text-input" value={form.active} onChange={set("active")}>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </Field>
      </div>
      <div className="field-row">
        <Field label="Valid from">
          <input className="text-input" type="date" value={form.validFrom} onChange={set("validFrom")} />
        </Field>
        <Field label="Valid until" error={errors.validUntil}>
          <input className="text-input" type="date" value={form.validUntil} onChange={set("validUntil")} />
        </Field>
      </div>
    </Modal>
  );
}
