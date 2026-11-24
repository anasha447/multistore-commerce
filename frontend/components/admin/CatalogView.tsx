"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EmptyBlock, StatusBadge } from "./ui";
import { icons } from "./icons";
import { CategoryModal } from "./CategoryModal";
import { ProductModal } from "./ProductModal";
import { api } from "@/lib/api";
import { formatMoney } from "@/lib/utils/money";
import type { CategoryResponse } from "@/lib/api";
import type { AdminCatalog } from "@/lib/server/adminCatalog";

export function CatalogView({ data }: { data: AdminCatalog }) {
  const router = useRouter();
  const [catModal, setCatModal] = useState<{ initial: CategoryResponse | null; parentId: number | null } | null>(null);
  const [prodModal, setProdModal] = useState(false);
  const [busy, setBusy] = useState<number | null>(null);

  const refresh = () => router.refresh();

  const deleteCategory = async (c: CategoryResponse) => {
    if (!window.confirm(`Deactivate "${c.name}"? (soft delete — it's kept for existing orders)`)) return;
    setBusy(c.id);
    try {
      await api.categories.remove(c.id);
      refresh();
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="adm-content">
      <div className="page-head">
        <div className="ttl">
          <p>
            {data.products.filter((p) => p.active).length} active products across{" "}
            {data.categoryTree.length} categories.
          </p>
        </div>
        <button className="btn btn-primary" type="button" onClick={() => setProdModal(true)}>
          {icons.plus} New product
        </button>
      </div>

      <div className="dash-row" style={{ gridTemplateColumns: "minmax(260px, 1fr) 2.4fr", alignItems: "start" }}>
        {/* Categories */}
        <div className="card">
          <div className="card-head">
            <h3>Categories</h3>
            <button className="btn btn-outline btn-sm" type="button" onClick={() => setCatModal({ initial: null, parentId: null })}>
              {icons.plus} Root
            </button>
          </div>
          <div className="card-body">
            {data.categoryTree.length === 0 ? (
              <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>No categories yet.</p>
            ) : (
              <div className="cat-tree">
                {data.categoryTree.map((c) => (
                  <div key={c.id} className="cat-node" style={{ paddingLeft: 8 + c.depth * 18 }}>
                    <span className="cat-node-name">{c.name}</span>
                    <span className="cat-node-actions">
                      <button className="icon-btn" type="button" aria-label={`Add sub-category to ${c.name}`} onClick={() => setCatModal({ initial: null, parentId: c.id })}>{icons.plus}</button>
                      <button className="icon-btn" type="button" aria-label={`Edit ${c.name}`} onClick={() => setCatModal({ initial: c, parentId: c.parentId })}>{icons.edit}</button>
                      <button className="icon-btn is-danger" type="button" aria-label={`Delete ${c.name}`} disabled={busy === c.id} onClick={() => deleteCategory(c)}>{icons.trash}</button>
                    </span>
                  </div>
                ))}
              </div>
            )}
            <p style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 12 }}>
              Deletes are soft — categories are deactivated, never removed, so old orders stay intact.
            </p>
          </div>
        </div>

        {/* Products */}
        <div className="card">
          <div className="card-head">
            <h3>Products</h3>
            <span className="sub">{data.products.length} shown</span>
          </div>
          {data.products.length === 0 ? (
            <EmptyBlock title="No products yet">Create your first product to start the catalog.</EmptyBlock>
          ) : (
            <div className="tbl-wrap" style={{ marginTop: 10 }}>
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th className="num">Base price</th>
                    <th>Variants</th>
                    <th>Stock</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.products.map((p) => (
                    <tr key={p.id} className="is-link" tabIndex={0} role="link" aria-label={`Edit ${p.name}`} onClick={() => router.push(`/admin/catalog/${p.id}`)} onKeyDown={(e) => e.key === "Enter" && router.push(`/admin/catalog/${p.id}`)}>
                      <td style={{ fontWeight: 600 }}>{p.name}<div className="mono muted" style={{ fontSize: 11 }}>/{p.slug}</div></td>
                      <td className="muted">{p.categoryName}</td>
                      <td className="num money">{formatMoney(p.basePrice)}</td>
                      <td className="mono" style={{ fontSize: 12.5 }}>{p.variantCount}</td>
                      <td>
                        {p.outOfStock > 0 ? (
                          <StatusBadge value="OUT" label={`${p.outOfStock} out`} />
                        ) : p.lowStock > 0 ? (
                          <StatusBadge value="LOW" label={`${p.lowStock} low`} />
                        ) : (
                          <StatusBadge value="OK" label="OK" />
                        )}
                      </td>
                      <td><StatusBadge value={p.active ? "ACTIVE" : "INACTIVE"} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {catModal && (
        <CategoryModal
          initial={catModal.initial}
          parentId={catModal.parentId}
          onClose={() => setCatModal(null)}
          onSaved={() => {
            setCatModal(null);
            refresh();
          }}
        />
      )}
      {prodModal && (
        <ProductModal
          initial={null}
          categories={data.categories}
          onClose={() => setProdModal(false)}
          onSaved={(product) => {
            setProdModal(false);
            router.push(`/admin/catalog/${product.id}`);
          }}
        />
      )}
    </div>
  );
}
