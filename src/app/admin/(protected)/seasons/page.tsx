import { createClient } from "@/lib/supabase/server";
import { SeasonsPageClient } from "./seasons-page-client";

export default async function SeasonsPage() {
  const supabase = await createClient();
  const { data: seasons } = await supabase
    .from("seasons")
    .select("id, name, start_date, end_date, status, carry_over_points, weekly_off_days")
    .order("start_date", { ascending: false });

  const { data: dayCounts } = await supabase.from("program_days").select("season_id");
  const countsBySeason: Record<string, number> = {};
  for (const d of dayCounts ?? []) {
    countsBySeason[d.season_id] = (countsBySeason[d.season_id] ?? 0) + 1;
  }

  return <SeasonsPageClient seasons={seasons ?? []} dayCounts={countsBySeason} />;
}
