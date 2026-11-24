/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StatusBadge } from "./ui";
import { icons } from "./icons";
import { ProductModal } from "./ProductModal";
import { VariantModal } from "./VariantModal";
import { ImageUploadModal } from "./ImageUploadModal";
import { api } from "@/lib/api";
import { formatMoney } from "@/lib/utils/money";
import { mediaUrl } from "@/lib/utils/media";
import type { CategoryResponse, ProductVariantResponse } from "@/lib/api";
import type { AdminProductDetail } from "@/lib/server/adminCatalog";

export function ProductEditor({
  detail,
  categories,
}: {
  detail: AdminProductDetail;
  categories: CategoryResponse[];
}) {
  const router = useRouter();
  const { product, categoryName, variants, images } = detail;
  const [editProduct, setEditProduct] = useState(false);
  const [variantModal, setVariantModal] = useState<{ initial: ProductVariantResponse | null } | null>(null);
  const [uploadModal, setUploadModal] = useState(false);
  const [busy, setBusy] = useState<number | null>(null);

  const refresh = () => router.refresh();
  const primaryImg = images.find((i) => i.primary) ?? images[0];

  const stockBadge = (v: ProductVariantResponse) => {
    if (v.stockQuantity === 0) return <StatusBadge value="OUT" label="Out of stock" />;
    if (v.stockQuantity < v.restockLevel) return <StatusBadge value="LOW" label="Low stock" />;
    return <StatusBadge value="OK" label="In stock" />;
  };

  const deleteVariant = async (v: ProductVariantResponse) => {
    if (!window.confirm(`Delete variant ${v.sku}?`)) return;
    setBusy(v.id);
    try {
      await api.variants.remove(v.id);
      refresh();
    } finally {
      setBusy(null);
    }
  };

  const setPrimary = async (imageId: number, url: string, altText: string, displayOrder: number, variantId: number | null) => {
    setBusy(imageId);
    try {
      await api.images.update(imageId, { variantId, url, altText, displayOrder, primary: true });
      refresh();
    } finally {
      setBusy(null);
    }
  };

  const deleteImage = async (imageId: number) => {
    if (!window.confirm("Remove this image?")) return;
    setBusy(imageId);
    try {
      await api.images.remove(imageId);
      refresh();
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="adm-content">
      <div className="page-head">
        <div className="prod-head">
          {primaryImg ? (
            <img className="ph-img" src={mediaUrl(primaryImg.url)} alt={primaryImg.altText || product.name} />
          ) : (
            <span className="ph-img" style={{ display: "grid", placeItems: "center", color: "var(--text-secondary)" }}>{icons.catalog}</span>
          )}
          <div className="ph-body">
            <h2>{product.name}</h2>
            <div className="meta">/{product.slug} · {categoryName} · base {formatMoney(product.basePrice)}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-outline btn-sm" type="button" onClick={() => router.push("/admin/catalog")}>{icons.chevL} Catalog</button>
          <button className="btn btn-outline btn-sm" type="button" onClick={() => setEditProduct(true)}>{icons.edit} Edit product</button>
        </div>
      </div>

      <div className="dash-row cols-3-2" style={{ alignItems: "start" }}>
        {/* Variants */}
        <div className="card">
          <div className="card-head">
            <h3>Variants</h3>
            <button className="btn btn-outline btn-sm" type="button" onClick={() => setVariantModal({ initial: null })}>{icons.plus} Add variant</button>
          </div>
          {variants.length === 0 ? (
            <div className="card-body"><p style={{ color: "var(--text-secondary)", fontSize: 13 }}>No stock row yet — products created now get one automatically; add a variation if this product comes in sizes or colours.</p></div>
          ) : (
            <div className="tbl-wrap" style={{ marginTop: 10 }}>
              <table className="tbl">
                <thead>
                  <tr><th>SKU</th><th>Size</th><th>Colour</th><th className="num">Price</th><th className="num">Stock</th><th>Status</th><th aria-label="Actions" /></tr>
                </thead>
                <tbody>
                  {variants.map((v) => (
                    <tr key={v.id}>
                      <td className="id-cell">{v.sku}</td>
                      <td className="muted">{v.defaultVariant ? "Product stock (no variations)" : v.size ?? "—"}</td>
                      <td className="muted">{v.color ?? "—"}</td>
                      <td className="num money">{formatMoney(v.effectivePrice)}</td>
                      <td className="num mono" style={{ fontSize: 12.5 }}>{v.stockQuantity}</td>
                      <td>{stockBadge(v)}</td>
                      <td className="num" style={{ whiteSpace: "nowrap" }}>
                        <button className="icon-btn" type="button" aria-label={`Edit ${v.sku}`} onClick={() => setVariantModal({ initial: v })}>{icons.edit}</button>{" "}
                        {!v.defaultVariant && (
                          <button className="icon-btn is-danger" type="button" aria-label={`Delete ${v.sku}`} disabled={busy === v.id} onClick={() => deleteVariant(v)}>{icons.trash}</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Images */}
        <div className="card">
          <div className="card-head">
            <h3>Images</h3>
            <button className="btn btn-primary btn-sm" type="button" onClick={() => setUploadModal(true)}>{icons.plus} Upload</button>
          </div>
          <div className="card-body">
            {images.length === 0 ? (
              <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>No images yet. Uploads are converted to WebP automatically.</p>
            ) : (
              <div className="img-grid">
                {images.map((img) => (
                  <div key={img.id} className={`img-cell${img.primary ? " is-primary" : ""}`}>
                    <img src={mediaUrl(img.url)} alt={img.altText || product.name} />
                    {img.primary && <span className="img-primary-tag">Primary</span>}
                    <div className="img-cell-actions">
                      {!img.primary && (
                        <button className="btn btn-outline btn-sm" type="button" disabled={busy === img.id} onClick={() => setPrimary(img.id, img.url, img.altText, img.displayOrder, img.variantId)}>Set primary</button>
                      )}
                      <button className="icon-btn is-danger" type="button" aria-label="Delete image" disabled={busy === img.id} onClick={() => deleteImage(img.id)}>{icons.trash}</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {editProduct && (
        <ProductModal
          initial={product}
          categories={categories}
          onClose={() => setEditProduct(false)}
          onSaved={() => {
            setEditProduct(false);
            refresh();
          }}
        />
      )}
      {variantModal && (
        <VariantModal
          productId={product.id}
          initial={variantModal.initial}
          onClose={() => setVariantModal(null)}
          onSaved={() => {
            setVariantModal(null);
            refresh();
          }}
        />
      )}
      {uploadModal && (
        <ImageUploadModal
          productId={product.id}
          onClose={() => setUploadModal(false)}
          onUploaded={() => {
            setUploadModal(false);
            refresh();
          }}
        />
      )}
    </div>
  );
}
