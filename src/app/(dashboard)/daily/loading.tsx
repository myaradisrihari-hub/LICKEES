import { PageHeaderSkeleton, FormCardSkeleton } from "@/components/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function DailyLoading() {
  return (
    <div>
      <PageHeaderSkeleton />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <FormCardSkeleton fields={3} />
          <FormCardSkeleton fields={2} />
        </div>
        <Skeleton className="h-72 rounded-2xl lg:col-span-1" />
      </div>
    </div>
  );
}
