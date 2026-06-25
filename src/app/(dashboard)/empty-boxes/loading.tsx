import { PageHeaderSkeleton, FormCardSkeleton, TableSkeleton } from "@/components/skeletons";

export default function EmptyBoxesLoading() {
  return (
    <div>
      <PageHeaderSkeleton />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <FormCardSkeleton fields={4} />
        </div>
        <div className="lg:col-span-2">
          <TableSkeleton />
        </div>
      </div>
    </div>
  );
}
