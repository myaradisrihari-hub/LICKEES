import { PageHeaderSkeleton, FormCardSkeleton } from "@/components/skeletons";

export default function SettingsLoading() {
  return (
    <div>
      <PageHeaderSkeleton />
      <div className="max-w-xl">
        <FormCardSkeleton fields={2} />
      </div>
    </div>
  );
}
