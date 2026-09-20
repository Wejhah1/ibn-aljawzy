import { createClient } from "@/lib/supabase/server";
import { ReportsClient } from "./reports-client";

export default async function ReportsPage() {
  const supabase = await createClient();

  const { data: currentSeason } = await supabase.from("seasons").select("id, name").eq("status", "current").maybeSingle();

  if (!currentSeason) {
    return (
      <main className="p-(--space-8) max-w-[600px] mx-auto text-center">
        <p className="text-sm font-semibold text-ink-muted">لا يوجد موسم حالي لعرض تقاريره.</p>
      </main>
    );
  }

  const { data: programDays } = await supabase
    .from("program_days")
    .select("id, day_date")
    .eq("season_id", currentSeason.id)
    .eq("is_holiday", false)
    .lte("day_date", new Date().toISOString().slice(0, 10))
    .order("day_date");

  const { data: attendance } = await supabase
    .from("attendance_records")
    .select("program_day_id, status")
    .eq("season_id", currentSeason.id);

  const attendanceTrend = (programDays ?? []).map((d) => {
    const dayRecords = (attendance ?? []).filter((a) => a.program_day_id === d.id);
    return {
      date: new Date(d.day_date).toLocaleDateString("ar-SA", { day: "numeric", month: "numeric" }),
      حاضر: dayRecords.filter((r) => r.status === "present").length,
      متأخر: dayRecords.filter((r) => r.status === "late").length,
      غائب: dayRecords.filter((r) => r.status === "absent").length,
      بعذر: dayRecords.filter((r) => r.status === "excused").length,
    };
  });

  const { data: enrollments } = await supabase
    .from("student_season_enrollments")
    .select("total_points, circle_id, circles(name)")
    .eq("season_id", currentSeason.id)
    .eq("status", "active");

  const pointsBuckets = [
    { name: "0-24", min: 0, max: 24 },
    { name: "25-49", min: 25, max: 49 },
    { name: "50-99", min: 50, max: 99 },
    { name: "100-199", min: 100, max: 199 },
    { name: "+200", min: 200, max: Infinity },
  ].map((b) => ({
    name: b.name,
    عدد_الطلاب: (enrollments ?? []).filter((e) => e.total_points >= b.min && e.total_points <= b.max).length,
  }));

  const circleMap = new Map<string, { name: string; totalPoints: number; count: number }>();
  for (const e of enrollments ?? []) {
    const c = Array.isArray(e.circles) ? e.circles[0] : e.circles;
    const name = c?.name ?? "بلا حلقة";
    const key = e.circle_id ?? "none";
    if (!circleMap.has(key)) circleMap.set(key, { name, totalPoints: 0, count: 0 });
    const entry = circleMap.get(key)!;
    entry.totalPoints += e.total_points;
    entry.count++;
  }
  const circleComparison = Array.from(circleMap.values()).map((c) => ({
    name: c.name,
    متوسط_النقاط: c.count > 0 ? Math.round(c.totalPoints / c.count) : 0,
    عدد_الطلاب: c.count,
  }));

  const totalAttendanceRecords = attendance?.length ?? 0;
  const presentCount = (attendance ?? []).filter((a) => a.status === "present" || a.status === "late").length;
  const overallAttendanceRate = totalAttendanceRecords > 0 ? Math.round((presentCount / totalAttendanceRecords) * 100) : 0;

  return (
    <ReportsClient
      seasonName={currentSeason.name}
      attendanceTrend={attendanceTrend}
      pointsDistribution={pointsBuckets}
      circleComparison={circleComparison}
      overallAttendanceRate={overallAttendanceRate}
      totalStudents={enrollments?.length ?? 0}
    />
  );
}
