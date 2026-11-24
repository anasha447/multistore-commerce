"use client";

import { useState } from "react";
import { Modal } from "./Modal";
import { Field } from "./ui";
import { icons } from "./icons";
import { api, ApiError } from "@/lib/api";

/** Provision a MANAGER with a temp password (they must change it on first login). */
export function ProvisionModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ email: "", firstName: "", lastName: "", phone: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    const errs: Record<string, string> = {};
    if (!/^\S+@\S+\.\S+$/.test(form.email)) errs.email = "Enter a valid email address.";
    if (!form.firstName.trim()) errs.firstName = "First name is required.";
    if (!form.lastName.trim()) errs.lastName = "Last name is required.";
    if (form.password.length < 8 || form.password.length > 100)
      errs.password = "Temporary password must be 8–100 characters.";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setBusy(true);
    try {
      await api.admin.createStaff({
        email: form.email,
        password: form.password,
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone || null,
      });
      onCreated();
    } catch (e) {
      setErrors(
        e instanceof ApiError && e.isConflict
          ? { email: "An account with this email already exists (409)." }
          : { _form: e instanceof ApiError ? e.message : "Couldn't provision the manager." },
      );
      setBusy(false);
    }
  };

  return (
    <Modal
      title="Provision manager"
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-outline" type="button" onClick={onClose} disabled={busy}>
            Discard
          </button>
          <button className="btn btn-primary" type="button" onClick={save} disabled={busy}>
            {busy ? "Creating…" : "Create manager"}
          </button>
        </>
      }
    >
      {errors._form && <p className="co-error">{errors._form}</p>}
      <div className="alert alert-info" style={{ marginBottom: 14 }}>
        {icons.info ?? null}
        <span>
          New accounts get the <b>MANAGER</b> role. Set a temporary password and share it securely —
          they&apos;ll be required to change it the first time they sign in.
        </span>
      </div>
      <div className="field-row">
        <Field label="First name" error={errors.firstName}>
          <input className="text-input" value={form.firstName} onChange={set("firstName")} autoComplete="off" />
        </Field>
        <Field label="Last name" error={errors.lastName}>
          <input className="text-input" value={form.lastName} onChange={set("lastName")} autoComplete="off" />
        </Field>
      </div>
      <Field label="Email" error={errors.email}>
        <input className="text-input" type="email" value={form.email} onChange={set("email")} placeholder="name@matessa.com" autoComplete="off" />
      </Field>
      <Field label="Phone (optional)">
        <input className="text-input" type="tel" value={form.phone} onChange={set("phone")} autoComplete="off" />
      </Field>
      <Field label="Temporary password" error={errors.password} hint="8–100 characters. They'll replace it on first login.">
        {/* textTransform:none — .mono-input uppercases the display, which is misleading for a
            case-sensitive password (you'd share the wrong case). Show exactly what's typed. */}
        <input className="text-input mono-input" style={{ textTransform: "none" }} type="text" value={form.password} onChange={set("password")} placeholder="e.g. Trail-Setup-26" autoComplete="off" />
      </Field>
    </Modal>
  );
}
