import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import SettingsForm from "@/components/SettingsForm";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: settings } = await supabase
    .from("user_settings")
    .select("*")
    .eq("id", user!.id)
    .single();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return (
    <AppShell>
      <h1 className="text-lg font-semibold text-gray-100 mb-8">Settings</h1>
      <SettingsForm initialSettings={settings} appUrl={appUrl} />
    </AppShell>
  );
}
