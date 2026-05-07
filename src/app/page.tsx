import { createClient } from "@/lib/supabase/server";
import Nav from "@/components/Nav";
import WordList from "@/components/WordList";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: words } = await supabase
    .from("words")
    .select("*")
    .eq("archived", false)
    .order("created_at", { ascending: false });

  return (
    <>
      <Nav />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <WordList initialWords={words ?? []} />
      </main>
    </>
  );
}
