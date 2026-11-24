import { CatalogView } from "@/components/admin/CatalogView";
import { getAdminCatalog } from "@/lib/server/adminCatalog";

export const dynamic = "force-dynamic";

export default async function AdminCatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const categoryId = category && /^\d+$/.test(category) ? Number(category) : undefined;
  const data = await getAdminCatalog(categoryId);
  return <CatalogView data={data} />;
}
