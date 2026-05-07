import { createClient } from "@/lib/supabase/server";
import Nav from "@/components/Nav";
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
    <>
      <Nav />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-xl font-semibold mb-8">Settings</h1>
        <SettingsForm initialSettings={settings} appUrl={appUrl} />
      </main>
    </>
  );
}
