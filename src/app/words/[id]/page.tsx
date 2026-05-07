import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Nav from "@/components/Nav";
import WordDetail from "@/components/WordDetail";

export default async function WordPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: word } = await supabase
    .from("words")
    .select("*")
    .eq("id", id)
    .single();

  if (!word) notFound();

  const { data: examples } = await supabase
    .from("dialogue_examples")
    .select("*")
    .eq("word_id", id)
    .order("created_at", { ascending: true });

  return (
    <>
      <Nav />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <WordDetail word={word} initialExamples={examples ?? []} />
      </main>
    </>
  );
}
