import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import WordList from "@/components/WordList";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: words } = await supabase
    .from("words")
    .select("*")
    .eq("archived", false)
    .order("created_at", { ascending: false });

  return (
    <AppShell>
      <WordList initialWords={words ?? []} />
    </AppShell>
  );
}
