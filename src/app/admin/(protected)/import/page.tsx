import { createClient } from "@/lib/supabase/server";
import { ImportClient } from "./import-client";

export default async function ImportPage() {
  const supabase = await createClient();
  const { data: currentSeason } = await supabase.from("seasons").select("id, name").eq("status", "current").maybeSingle();

  return (
    <main className="p-(--space-4) md:p-(--space-8) max-w-[900px] mx-auto">
      <h1 className="text-[22px] leading-[30px] font-bold text-ink mb-(--space-2)">استيراد الطلاب من Excel</h1>
      <p className="text-sm text-ink-muted mb-(--space-6)">
        إضافة طلاب جدد أو تحديث بيانات موجودة (بمطابقة عمود &quot;كود&quot; إن وُجد).
      </p>
      <ImportClient currentSeason={currentSeason} />
    </main>
  );
}
