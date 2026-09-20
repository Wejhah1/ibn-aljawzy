import { createClient } from "@/lib/supabase/server";
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
    .select("period_label, is_published, percentage")
    .eq("season_id", currentSeason.id);

  const periodMap = new Map<string, { count: number; avg: number; isPublished: boolean }>();
  for (const r of results ?? []) {
    if (!periodMap.has(r.period_label)) periodMap.set(r.period_label, { count: 0, avg: 0, isPublished: r.is_published });
    const p = periodMap.get(r.period_label)!;
    p.avg = (p.avg * p.count + r.percentage) / (p.count + 1);
    p.count++;
  }
  const periods = Array.from(periodMap.entries()).map(([label, v]) => ({
    label,
    count: v.count,
    avg: Math.round(v.avg),
    isPublished: v.isPublished,
  }));

  return <MonthlyResultsClient seasonId={currentSeason.id} seasonName={currentSeason.name} periods={periods} />;
}
