import { PageHeader } from "@/components/page-header";
import { getPlannerData } from "@/lib/data";
import { getSettings } from "@/lib/supabase/auth";
import { PlannerView } from "./planner-view";

export const dynamic = "force-dynamic";

export default async function PlannerPage() {
  const [data, settings] = await Promise.all([
    getPlannerData(30),
    getSettings(),
  ]);

  return (
    <div>
      <PageHeader
        title="Smart Order Planner"
        description="A capacity-aware order sheet that keeps fast sellers stocked and reduces wastage."
      />
      {data.stock.length === 0 ? (
        <p className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground">
          Add inventory items and record some sales first, then come back for a
          smart order plan.
        </p>
      ) : (
        <PlannerView
          stock={data.stock}
          soldPieces={data.soldPieces}
          windowDays={data.windowDays}
          defaultCapacity={settings.fridge_capacity}
        />
      )}
    </div>
  );
}
