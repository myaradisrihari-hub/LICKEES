import { PageHeaderSkeleton, StatCardsSkeleton, TableSkeleton } from "@/components/skeletons";

export default function InventoryLoading() {
  return (
    <div>
      <PageHeaderSkeleton />
      <div className="mb-6">
        <StatCardsSkeleton count={3} />
      </div>
      <TableSkeleton />
    </div>
  );
}
