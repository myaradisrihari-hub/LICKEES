import { PageHeader } from "@/components/page-header";
import { DailyForm } from "./daily-form";

export const dynamic = "force-dynamic";

export default function DailyPage() {
  return (
    <div>
      <PageHeader
        title="Daily Entry"
        description="Record today's revenue and expenses in under a minute."
      />
      <DailyForm />
    </div>
  );
}
