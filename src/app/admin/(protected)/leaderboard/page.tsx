import { createClient } from "@/lib/supabase/server";
import { getProgramInfo } from "@/lib/settings";
import { LeaderboardClient } from "./leaderboard-client";

export default async function LeaderboardPage() {
  const supabase = await createClient();

  const { data: currentSeason } = await supabase.from("seasons").select("id, name").eq("status", "current").maybeSingle();

  if (!currentSeason) {
    return (
      <main className="p-(--space-8) max-w-[600px] mx-auto text-center">
        <p className="text-sm font-semibold text-ink-muted">لا يوجد موسم حالي.</p>
      </main>
    );
  }

  const { data: enrollments } = await supabase
    .from("student_season_enrollments")
    .select("student_id, total_points, students(full_name, code, photo_url), circles(name)")
    .eq("season_id", currentSeason.id)
    .eq("status", "active");

  const { data: attendance } = await supabase
    .from("attendance_records")
    .select("student_id, status")
    .eq("season_id", currentSeason.id);

  const { data: achievementCounts } = await supabase
    .from("student_achievements")
    .select("student_id")
    .eq("season_id", currentSeason.id);

  const attendanceByStudent: Record<string, { present: number; total: number }> = {};
  for (const a of attendance ?? []) {
    attendanceByStudent[a.student_id] ??= { present: 0, total: 0 };
    attendanceByStudent[a.student_id].total++;
    if (a.status === "present" || a.status === "late") attendanceByStudent[a.student_id].present++;
  }

  const achievementByStudent: Record<string, number> = {};
  for (const a of achievementCounts ?? []) {
    achievementByStudent[a.student_id] = (achievementByStudent[a.student_id] ?? 0) + 1;
  }

  const entries = (enrollments ?? []).map((e) => {
    const s = Array.isArray(e.students) ? e.students[0] : e.students;
    const c = Array.isArray(e.circles) ? e.circles[0] : e.circles;
    const att = attendanceByStudent[e.student_id];
    return {
      studentId: e.student_id,
      fullName: s?.full_name ?? "—",
      code: s?.code ?? "—",
      circleName: c?.name ?? null,
      points: e.total_points,
      attendanceRate: att && att.total > 0 ? Math.round((att.present / att.total) * 100) : 0,
      achievementsCount: achievementByStudent[e.student_id] ?? 0,
    };
  });

  const programInfo = await getProgramInfo(supabase);

  return (
    <LeaderboardClient seasonName={currentSeason.name} entries={entries} programInfo={programInfo} />
  );
}
