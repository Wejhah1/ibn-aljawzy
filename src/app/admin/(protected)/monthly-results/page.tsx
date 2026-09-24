import { createClient } from "@/lib/supabase/server";
import { getProgramInfo } from "@/lib/settings";
import { MonthlyResultsClient } from "./monthly-results-client";

export default async function MonthlyResultsPage() {
  const supabase = await createClient();
  const { data: currentSeason } = await supabase.from("seasons").select("id, name").eq("status", "current").maybeSingle();

  if (!currentSeason) {
    return (
      <main className="p-(--space-8) max-w-[600px] mx-auto text-center">
        <p className="text-sm font-semibold text-ink-muted">لا يوجد موسم حالي.</p>
      </main>
    );
  }

  const { data: results } = await supabase
    .from("monthly_results")
    .select("period_label, is_published, percentage, exam_date")
    .eq("season_id", currentSeason.id);

  const periodMap = new Map<string, { total: number; count: number; avg: number; isPublished: boolean; examDate: string | null }>();
  for (const r of results ?? []) {
    if (!periodMap.has(r.period_label)) periodMap.set(r.period_label, { total: 0, count: 0, avg: 0, isPublished: r.is_published, examDate: r.exam_date });
    const p = periodMap.get(r.period_label)!;
    p.total++;
    if (r.percentage !== null) {
      p.avg = (p.avg * p.count + r.percentage) / (p.count + 1);
      p.count++;
    }
    if (r.exam_date) p.examDate = r.exam_date;
  }
  const periods = Array.from(periodMap.entries()).map(([label, v]) => ({
    label,
    count: v.total,
    avg: Math.round(v.avg),
    isPublished: v.isPublished,
    examDate: v.examDate,
  }));

  const programInfo = await getProgramInfo(supabase);

  return (
    <MonthlyResultsClient
      seasonId={currentSeason.id}
      seasonName={currentSeason.name}
      periods={periods}
      programName={programInfo.program_name}
      mosqueName={programInfo.mosque_name}
    />
  );
}
