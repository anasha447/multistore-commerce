import { notFound } from "next/navigation";
import { ProductEditor } from "@/components/admin/ProductEditor";
import { getAdminCatalog, getAdminProductDetail } from "@/lib/server/adminCatalog";

export const dynamic = "force-dynamic";

export default async function AdminProductEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();

  const [detail, catalog] = await Promise.all([
    getAdminProductDetail(Number(id)),
    getAdminCatalog(),
  ]);
  if (!detail) notFound();

  return <ProductEditor detail={detail} categories={catalog.categories} />;
}
