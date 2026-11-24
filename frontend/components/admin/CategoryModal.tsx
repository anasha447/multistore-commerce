"use client";

import { useState } from "react";
import { Modal } from "./Modal";
import { Field } from "./ui";
import { api, ApiError } from "@/lib/api";
import type { CategoryRequest, CategoryResponse } from "@/lib/api";

const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

/** Create/edit a category. `parent` sets parentId for a new child; `initial` = edit. */
export function CategoryModal({
  initial,
  parentId,
  onClose,
  onSaved,
}: {
  initial: CategoryResponse | null;
  parentId: number | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    slug: initial?.slug ?? "",
    description: initial?.description ?? "",
    displayOrder: (initial?.displayOrder ?? 0).toString(),
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const save = async () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Name is required.";
    if (!form.slug.trim()) errs.slug = "Slug is required.";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    const body: CategoryRequest = {
      parentId: initial ? initial.parentId : parentId,
      name: form.name.trim(),
      slug: form.slug.trim(),
      description: form.description.trim() || null,
      imageUrl: initial?.imageUrl ?? null,
      displayOrder: Number(form.displayOrder) || 0,
    };
    setBusy(true);
    try {
      if (initial) await api.categories.update(initial.id, body);
      else await api.categories.create(body);
      onSaved();
    } catch (e) {
      setErrors(
        e instanceof ApiError && e.isConflict
          ? { slug: "Slug already exists (409)." }
          : { _form: e instanceof ApiError ? e.message : "Couldn't save the category." },
      );
      setBusy(false);
    }
  };

  return (
    <Modal
      title={initial ? "Edit category" : parentId ? "New sub-category" : "New category"}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-outline" type="button" onClick={onClose} disabled={busy}>Discard</button>
          <button className="btn btn-primary" type="button" onClick={save} disabled={busy}>
            {busy ? "Saving…" : initial ? "Save changes" : "Create"}
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
      <Field label="Slug" error={errors.slug} hint="URL-safe identifier.">
        <input className="text-input mono-input" value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: slugify(e.target.value) }))} />
      </Field>
      <Field label="Description">
        <input className="text-input" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
      </Field>
      <Field label="Display order">
        <input className="text-input" type="number" value={form.displayOrder} onChange={(e) => setForm((f) => ({ ...f, displayOrder: e.target.value }))} />
      </Field>
    </Modal>
  );
}
