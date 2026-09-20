import { createClient } from "@/lib/supabase/server";
import { NewStudentForm } from "./new-student-form";

export default async function NewStudentPage() {
  const supabase = await createClient();

  const { data: currentSeason } = await supabase
    .from("seasons")
    .select("id, name")
    .eq("status", "current")
    .maybeSingle();

  const { data: circles } = await supabase
    .from("circles")
    .select("id, name, groups(id, name)")
    .eq("is_active", true)
    .order("name");

  return (
    <main className="p-(--space-4) md:p-(--space-8) max-w-[640px] mx-auto">
      <h1 className="text-[22px] leading-[30px] font-bold text-ink mb-(--space-6)">طالب جديد</h1>
      <NewStudentForm currentSeason={currentSeason} circles={circles ?? []} />
    </main>
  );
}
