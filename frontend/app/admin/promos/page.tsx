import { PromotionsView } from "@/components/admin/PromotionsView";
import { getPromotionsData } from "@/lib/server/promotions";

export const dynamic = "force-dynamic";

export default async function AdminPromotionsPage() {
  const data = await getPromotionsData();
  return <PromotionsView data={data} />;
}
