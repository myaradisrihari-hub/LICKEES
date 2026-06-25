import { PageHeader } from "@/components/page-header";
import { getSettings } from "@/lib/supabase/auth";
import { SettingsForm } from "./settings-form";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const settings = await getSettings();
  return (
    <div>
      <PageHeader title="Settings" description="Configure your shop." />
      <SettingsForm
        shopName={settings.shop_name}
        fridgeCapacity={settings.fridge_capacity}
      />
    </div>
  );
}
