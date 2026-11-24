"use client";

import { useState } from "react";
import { Modal } from "./Modal";
import { Field } from "./ui";
import { api, ApiError } from "@/lib/api";
import type { DiscountRequest } from "@/lib/api";

interface Option {
  id: number;
  name: string;
  parentId?: number | null;
}

/** Create an automatic discount on exactly one product OR category. POST via BFF. */
export function DiscountModal({
  products,
  categories,
  onClose,
  onSaved,
}: {
  products: Option[];
  categories: Option[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    target: "product",
    productId: "",
    categoryId: "",
    type: "PERCENTAGE",
    value: "",
    validFrom: "2026-06-13",
    validTo: "2026-07-13",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    const errs: Record<string, string> = {};
    if (form.target === "product" && !form.productId) errs.productId = "Pick a product.";
    if (form.target === "category" && !form.categoryId) errs.categoryId = "Pick a category.";
    if (!(Number(form.value) > 0)) errs.value = "Value must be positive.";
    if (new Date(form.validTo) <= new Date(form.validFrom)) errs.validTo = "Must end after it starts.";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    const body: DiscountRequest = {
      productId: form.target === "product" ? Number(form.productId) : null,
      categoryId: form.target === "category" ? Number(form.categoryId) : null,
      type: form.type as DiscountRequest["type"],
      value: Number(form.value),
      validFrom: `${form.validFrom}T00:00:00Z`,
      validTo: `${form.validTo}T23:59:59Z`,
      active: true,
    };

    setBusy(true);
    try {
      await api.discounts.create(body);
      onSaved();
    } catch (e) {
      setErrors({ _form: e instanceof ApiError ? e.message : "Couldn't create the discount." });
      setBusy(false);
    }
  };

  return (
    <Modal
      title="New discount"
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-outline" type="button" onClick={onClose} disabled={busy}>
            Discard
          </button>
          <button className="btn btn-primary" type="button" onClick={save} disabled={busy}>
            {busy ? "Creating…" : "Create discount"}
          </button>
        </>
      }
    >
      {errors._form && <p className="co-error">{errors._form}</p>}
      <Field label="Applies to" hint="Exactly one — a product OR a whole category.">
        <select className="text-input" value={form.target} onChange={set("target")}>
          <option value="product">A single product</option>
          <option value="category">A whole category</option>
        </select>
      </Field>
      {form.target === "product" ? (
        <Field label="Product" error={errors.productId}>
          <select className="text-input" value={form.productId} onChange={set("productId")}>
            <option value="">Select…</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </Field>
      ) : (
        <Field label="Category" error={errors.categoryId}>
          <select className="text-input" value={form.categoryId} onChange={set("categoryId")}>
            <option value="">Select…</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.parentId ? "— " : ""}
                {c.name}
              </option>
            ))}
          </select>
        </Field>
      )}
      <div className="field-row">
        <Field label="Type">
          <select className="text-input" value={form.type} onChange={set("type")}>
            <option value="PERCENTAGE">Percentage</option>
            <option value="FIXED_AMOUNT">Fixed amount</option>
          </select>
        </Field>
        <Field label={form.type === "PERCENTAGE" ? "Value (%)" : "Value (USD)"} error={errors.value}>
          <input className="text-input" type="number" step="0.01" min="0" value={form.value} onChange={set("value")} />
        </Field>
      </div>
      <div className="field-row">
        <Field label="Valid from">
          <input className="text-input" type="date" value={form.validFrom} onChange={set("validFrom")} />
        </Field>
        <Field label="Valid to" error={errors.validTo}>
          <input className="text-input" type="date" value={form.validTo} onChange={set("validTo")} />
        </Field>
      </div>
    </Modal>
  );
}
