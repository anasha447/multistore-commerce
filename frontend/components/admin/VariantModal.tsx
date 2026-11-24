"use client";

import { useState } from "react";
import { Modal } from "./Modal";
import { Field } from "./ui";
import { api, ApiError } from "@/lib/api";
import type { ProductVariantRequest, ProductVariantResponse } from "@/lib/api";

/** Create/edit a product variant (SKU, size/colour, price override, stock). */
export function VariantModal({
  productId,
  initial,
  onClose,
  onSaved,
}: {
  productId: number;
  initial: ProductVariantResponse | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    size: initial?.size ?? "",
    color: initial?.color ?? "",
    priceOverride: initial?.priceOverride?.toString() ?? "",
    stockQuantity: (initial?.stockQuantity ?? 0).toString(),
    restockLevel: (initial?.restockLevel ?? 3).toString(),
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const save = async () => {
    const errs: Record<string, string> = {};
    if (Number(form.stockQuantity) < 0) errs.stockQuantity = "Stock can't be negative.";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    // SKU is omitted — the backend generates it from the product + size/colour.
    const body: ProductVariantRequest = {
      size: form.size.trim() || null,
      color: form.color.trim() || null,
      priceOverride: form.priceOverride === "" ? null : Number(form.priceOverride),
      stockQuantity: Number(form.stockQuantity),
      restockLevel: Number(form.restockLevel) || 0,
    };
    setBusy(true);
    try {
      if (initial) await api.variants.update(initial.id, body);
      else await api.variants.createForProduct(productId, body);
      onSaved();
    } catch (e) {
      setErrors({ _form: e instanceof ApiError ? e.message : "Couldn't save the variant." });
      setBusy(false);
    }
  };

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <Modal
      title={initial ? "Edit variant" : "New variant"}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-outline" type="button" onClick={onClose} disabled={busy}>Discard</button>
          <button className="btn btn-primary" type="button" onClick={save} disabled={busy}>
            {busy ? "Saving…" : initial ? "Save changes" : "Add variant"}
          </button>
        </>
      }
    >
      {errors._form && <p className="co-error">{errors._form}</p>}
      <Field label="SKU" hint="Generated automatically from the product, size and colour.">
        {initial ? (
          <input className="text-input mono-input" value={initial.sku} readOnly disabled />
        ) : (
          <input className="text-input mono-input" value="Auto-generated on save" readOnly disabled style={{ fontStyle: "italic", opacity: 0.7 }} />
        )}
      </Field>
      {!initial?.defaultVariant && (
      <div className="field-row">
        <Field label="Size" hint="Blank if not sized.">
          <input className="text-input" value={form.size} onChange={set("size")} placeholder="M" />
        </Field>
        <Field label="Colour" hint="Optional.">
          <input className="text-input" value={form.color} onChange={set("color")} placeholder="Red" />
        </Field>
      </div>
      )}
      <div className="field-row">
        <Field label="Price override" hint="Blank = use base price.">
          <input className="text-input" type="number" step="0.01" min="0" value={form.priceOverride} onChange={set("priceOverride")} />
        </Field>
        <Field label="Stock" error={errors.stockQuantity}>
          <input className="text-input" type="number" min="0" value={form.stockQuantity} onChange={set("stockQuantity")} />
        </Field>
      </div>
      <Field label="Restock level" hint="Low-stock threshold.">
        <input className="text-input" type="number" min="0" value={form.restockLevel} onChange={set("restockLevel")} />
      </Field>
    </Modal>
  );
}
