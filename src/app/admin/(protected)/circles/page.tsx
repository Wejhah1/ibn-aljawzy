import { createClient } from "@/lib/supabase/server";
import { CirclesPageClient } from "./circles-page-client";

export default async function CirclesPage() {
  const supabase = await createClient();

  const { data: currentSeason } = await supabase
    .from("seasons")
    .select("id, name")
    .eq("status", "current")
    .maybeSingle();

  const { data: circles } = await supabase
    .from("circles")
    .select("id, name, leader_name, leader_phone, is_active, groups(id, name, leader_name, leader_phone, color_token)")
    .order("created_at", { ascending: true });

  const { data: enrollmentCounts } = await supabase
    .from("student_season_enrollments")
    .select("circle_id, group_id")
    .eq("status", "active");

  const circleCounts: Record<string, number> = {};
  const groupCounts: Record<string, number> = {};
  for (const e of enrollmentCounts ?? []) {
    if (e.circle_id) circleCounts[e.circle_id] = (circleCounts[e.circle_id] ?? 0) + 1;
    if (e.group_id) groupCounts[e.group_id] = (groupCounts[e.group_id] ?? 0) + 1;
  }

  return (
    <CirclesPageClient
      circles={circles ?? []}
      currentSeasonId={currentSeason?.id ?? null}
      circleCounts={circleCounts}
      groupCounts={groupCounts}
    />
  );
}
