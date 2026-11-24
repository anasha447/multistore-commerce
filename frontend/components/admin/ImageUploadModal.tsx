/* eslint-disable @next/next/no-img-element */
"use client";

import { useRef, useState } from "react";
import { Modal } from "./Modal";
import { Field } from "./ui";

/** Upload a product image. The file is sent as multipart to the BFF, which forwards to
 *  commercial-service where it is converted to WebP server-side. Any input format works;
 *  what gets stored is always WebP. */
export function ImageUploadModal({
  productId,
  onClose,
  onUploaded,
}: {
  productId: number;
  onClose: () => void;
  onUploaded: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [altText, setAltText] = useState("");
  const [displayOrder, setDisplayOrder] = useState("1");
  const [primary, setPrimary] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const pick = (f: File | null) => {
    setError(null);
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setError("Please choose an image file (PNG, JPEG, WebP…).");
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const upload = async () => {
    if (!file) {
      setError("Choose an image to upload.");
      return;
    }
    setBusy(true);
    setError(null);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("altText", altText);
    fd.append("displayOrder", displayOrder || "0");
    fd.append("primary", String(primary));
    try {
      const res = await fetch(`/api/bff/api/products/${productId}/images/upload`, {
        method: "POST",
        body: fd,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.message || "Upload failed. Please try again.");
        setBusy(false);
        return;
      }
      onUploaded();
    } catch {
      setError("Network error — please try again.");
      setBusy(false);
    }
  };

  return (
    <Modal
      title="Upload image"
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-outline" type="button" onClick={onClose} disabled={busy}>Discard</button>
          <button className="btn btn-primary" type="button" onClick={upload} disabled={busy || !file}>
            {busy ? "Converting to WebP…" : "Upload"}
          </button>
        </>
      }
    >
      {error && <p className="co-error">{error}</p>}
      <div
        className={`img-dropzone${dragOver ? " is-over" : ""}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          pick(e.dataTransfer.files?.[0] ?? null);
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
      >
        {preview ? (
          <img src={preview} alt="Selected preview" className="img-preview" />
        ) : (
          <div className="img-drop-hint">
            <strong>Drop an image here</strong>
            <span>or click to choose · PNG/JPEG/WebP · converted to WebP automatically</span>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => pick(e.target.files?.[0] ?? null)}
        />
      </div>

      <Field label="Alt text" hint="Describe the image for accessibility.">
        <input className="text-input" value={altText} onChange={(e) => setAltText(e.target.value)} />
      </Field>
      <div className="field-row">
        <Field label="Display order">
          <input className="text-input" type="number" min="0" value={displayOrder} onChange={(e) => setDisplayOrder(e.target.value)} />
        </Field>
        <Field label="Primary">
          <select className="text-input" value={primary ? "yes" : "no"} onChange={(e) => setPrimary(e.target.value === "yes")}>
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </select>
        </Field>
      </div>
    </Modal>
  );
}
