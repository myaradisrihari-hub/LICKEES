import { AppShell } from "@/components/app-shell";
import { getSettings } from "@/lib/supabase/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSettings();

  return <AppShell shopName={settings.shop_name}>{children}</AppShell>;
}
