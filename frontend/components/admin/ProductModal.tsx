"use client";

import { useState } from "react";
import { Modal } from "./Modal";
import { Field } from "./ui";
import { api, ApiError } from "@/lib/api";
import type { CategoryResponse, ProductRequest, ProductResponse } from "@/lib/api";

const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

/** Create/edit a product. On create the new id is returned so the caller can open its editor. */
export function ProductModal({
  initial,
  categories,
  onClose,
  onSaved,
}: {
  initial: ProductResponse | null;
  categories: CategoryResponse[];
  onClose: () => void;
  onSaved: (product: ProductResponse) => void;
}) {
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    slug: initial?.slug ?? "",
    categoryId: (initial?.categoryId ?? categories[0]?.id ?? "").toString(),
    basePrice: initial?.basePrice?.toString() ?? "",
    brand: initial?.brand ?? "Matessa",
    description: initial?.description ?? "",
    stock: "0",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const save = async () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Name is required.";
    if (!form.slug.trim()) errs.slug = "Slug is required.";
    if (!form.categoryId) errs.categoryId = "Pick a category.";
    if (!(Number(form.basePrice) > 0)) errs.basePrice = "Base price must be positive.";
    if (!initial && !(Number.isInteger(Number(form.stock)) && Number(form.stock) >= 0)) errs.stock = "Stock must be 0 or more.";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    const body: ProductRequest = {
      categoryId: Number(form.categoryId),
      name: form.name.trim(),
      slug: form.slug.trim(),
      description: form.description.trim() || null,
      basePrice: Number(form.basePrice),
      ...(initial ? {} : { stockQuantity: Number(form.stock) }),
      brand: form.brand.trim() || "Matessa",
    };
    setBusy(true);
    try {
      const saved = initial ? await api.products.update(initial.id, body) : await api.products.create(body);
      onSaved(saved);
    } catch (e) {
      setErrors(
        e instanceof ApiError && e.isConflict
          ? { slug: "Slug already exists (409)." }
          : { _form: e instanceof ApiError ? e.message : "Couldn't save the product." },
      );
      setBusy(false);
    }
  };

  return (
    <Modal
      title={initial ? "Edit product" : "New product"}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-outline" type="button" onClick={onClose} disabled={busy}>Discard</button>
          <button className="btn btn-primary" type="button" onClick={save} disabled={busy}>
            {busy ? "Saving…" : initial ? "Save changes" : "Create product"}
          </button>
        </>
      }
    >
      {errors._form && <p className="co-error">{errors._form}</p>}
      <Field label="Name" error={errors.name}>
        <input
          className="text-input"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value, slug: initial ? f.slug : slugify(e.target.value) }))}
        />
      </Field>
      <div className="field-row">
        <Field label="Slug" error={errors.slug}>
          <input className="text-input mono-input" value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: slugify(e.target.value) }))} />
        </Field>
        <Field label="Category" error={errors.categoryId}>
          <select className="text-input" value={form.categoryId} onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </Field>
      </div>
      <div className="field-row">
        <Field label="Base price (USD)" error={errors.basePrice}>
          <input className="text-input" type="number" step="0.01" min="0" value={form.basePrice} onChange={(e) => setForm((f) => ({ ...f, basePrice: e.target.value }))} />
        </Field>
        <Field label="Brand">
          <input className="text-input" value={form.brand} onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))} />
        </Field>
      </div>
      {!initial && (
        <Field label="Stock" error={errors.stock} hint="For a product without sizes or colours. Add variations later to stock each one separately.">
          <input className="text-input" type="number" min="0" step="1" value={form.stock} onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))} />
        </Field>
      )}
      <Field label="Description">
        <input className="text-input" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
      </Field>
    </Modal>
  );
}
