import { createClient } from "@/lib/supabase/server";
import { getProgramInfo } from "@/lib/settings";
import { ClassicReportClient } from "./classic-report-client";

export type SortKey = "name" | "circle" | "points" | "attendance";

export default async function ClassicReportPage({
  searchParams,
}: {
  searchParams: Promise<{ circle?: string; group?: string; from?: string; to?: string; sort?: string }>;
}) {
  const { circle = "", group = "" } = await searchParams;
  const supabase = await createClient();

  const { data: currentSeason } = await supabase
    .from("seasons")
    .select("id, name, start_date, end_date")
    .eq("status", "current")
    .maybeSingle();

  if (!currentSeason) {
    return (
      <main className="p-(--space-8) max-w-[600px] mx-auto text-center">
        <p className="text-sm font-semibold text-ink-muted">لا يوجد موسم حالي لعرض تقريره.</p>
      </main>
    );
  }

  const todayIso = new Date().toISOString().slice(0, 10);
  const { from, to, sort: sortParam } = await searchParams;
  const fromDate = from && from >= currentSeason.start_date ? from : currentSeason.start_date;
  const toDate = to && to <= todayIso ? to : todayIso > currentSeason.end_date ? currentSeason.end_date : todayIso;
  const sort: SortKey = (["name", "circle", "points", "attendance"] as const).includes(sortParam as SortKey)
    ? (sortParam as SortKey)
    : "name";

  const { data: circles } = await supabase.from("circles").select("id, name").order("name");
  const { data: groups } = await supabase.from("groups").select("id, name").order("name");
  const programInfo = await getProgramInfo(supabase);

  const { data: programDays } = await supabase
    .from("program_days")
    .select("id")
    .eq("season_id", currentSeason.id)
    .eq("is_holiday", false)
    .gte("day_date", fromDate)
    .lte("day_date", toDate);
  const dayCount = programDays?.length ?? 0;
  const dayIds = new Set((programDays ?? []).map((d) => d.id));

  let enrollmentQuery = supabase
    .from("student_season_enrollments")
    .select("student_id, total_points, circle_id, group_id, students(code, full_name, status), circles(name), groups(name)")
    .eq("season_id", currentSeason.id)
    .eq("status", "active");
  if (circle) enrollmentQuery = enrollmentQuery.eq("circle_id", circle);
  if (group) enrollmentQuery = enrollmentQuery.eq("group_id", group);
  const { data: enrollments } = await enrollmentQuery;

  const studentIds = (enrollments ?? []).map((e) => e.student_id);

  const { data: attendance } = studentIds.length
    ? await supabase
        .from("attendance_records")
        .select("student_id, status, program_day_id")
        .eq("season_id", currentSeason.id)
        .in("student_id", studentIds)
    : { data: [] };

  const { data: flags } = studentIds.length
    ? await supabase
        .from("student_flags")
        .select("student_id, is_resolved, flags(name)")
        .in("student_id", studentIds)
        .eq("is_resolved", false)
    : { data: [] };

  const rows = (enrollments ?? [])
    .map((e) => {
      const s = Array.isArray(e.students) ? e.students[0] : e.students;
      const c = Array.isArray(e.circles) ? e.circles[0] : e.circles;
      const g = Array.isArray(e.groups) ? e.groups[0] : e.groups;
      if (!s || s.status !== "active") return null;
      const att = (attendance ?? []).filter((a) => a.student_id === e.student_id && dayIds.has(a.program_day_id));
      const present = att.filter((a) => a.status === "present").length;
      const late = att.filter((a) => a.status === "late").length;
      const excused = att.filter((a) => a.status === "excused").length;
      const absent = att.filter((a) => a.status === "absent").length;
      const marked = present + late + excused + absent;
      const studentFlags = (flags ?? [])
        .filter((f) => f.student_id === e.student_id)
        .map((f) => (Array.isArray(f.flags) ? f.flags[0]?.name : f.flags?.name))
        .filter((n): n is string => !!n);
      return {
        studentId: e.student_id,
        code: s.code,
        fullName: s.full_name,
        circleName: c?.name ?? null,
        groupName: g?.name ?? null,
        present,
        late,
        excused,
        absent,
        attendanceRate: marked > 0 ? Math.round(((present + late) / marked) * 100) : 0,
        points: e.total_points,
        flags: studentFlags,
      };
    })
    .filter((r): r is NonNullable<typeof r> => !!r);

  const sorted = [...rows].sort((a, b) => {
    if (sort === "points") return b.points - a.points;
    if (sort === "attendance") return b.attendanceRate - a.attendanceRate;
    if (sort === "circle") return (a.circleName ?? "").localeCompare(b.circleName ?? "", "ar") || a.fullName.localeCompare(b.fullName, "ar");
    return a.fullName.localeCompare(b.fullName, "ar");
  });

  const summary = {
    totalPoints: rows.reduce((sum, r) => sum + r.points, 0),
    avgAttendance: rows.length > 0 ? Math.round(rows.reduce((sum, r) => sum + r.attendanceRate, 0) / rows.length) : 0,
    absent: rows.reduce((sum, r) => sum + r.absent, 0),
    excused: rows.reduce((sum, r) => sum + r.excused, 0),
    late: rows.reduce((sum, r) => sum + r.late, 0),
    present: rows.reduce((sum, r) => sum + r.present, 0),
    studentCount: rows.length,
  };

  const circleMap = new Map<string, { name: string; points: number; attendanceSum: number; count: number }>();
  for (const r of rows) {
    const key = r.circleName ?? "بلا حلقة";
    if (!circleMap.has(key)) circleMap.set(key, { name: key, points: 0, attendanceSum: 0, count: 0 });
    const entry = circleMap.get(key)!;
    entry.points += r.points;
    entry.attendanceSum += r.attendanceRate;
    entry.count++;
  }
  const circleStats = Array.from(circleMap.values())
    .map((c) => ({ name: c.name, avgPoints: c.count ? Math.round(c.points / c.count) : 0, avgAttendance: c.count ? Math.round(c.attendanceSum / c.count) : 0, count: c.count }))
    .sort((a, b) => b.avgPoints - a.avgPoints);

  const attendanceBuckets = [
    { label: "0-25%", min: 0, max: 25 },
    { label: "26-50%", min: 26, max: 50 },
    { label: "51-75%", min: 51, max: 75 },
    { label: "76-100%", min: 76, max: 100 },
  ].map((b) => ({ label: b.label, count: rows.filter((r) => r.attendanceRate >= b.min && r.attendanceRate <= b.max).length }));

  return (
    <ClassicReportClient
      programInfo={programInfo}
      seasonName={currentSeason.name}
      startDate={fromDate}
      endDate={toDate}
      seasonStart={currentSeason.start_date}
      seasonEnd={currentSeason.end_date}
      dayCount={dayCount}
      circles={circles ?? []}
      groups={groups ?? []}
      selectedCircle={circle}
      selectedGroup={group}
      sort={sort}
      rows={sorted}
      summary={summary}
      circleStats={circleStats}
      attendanceBuckets={attendanceBuckets}
    />
  );
}
