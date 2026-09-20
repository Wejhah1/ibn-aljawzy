import { createClient } from "@/lib/supabase/server";
import { getProgramInfo } from "@/lib/settings";
import { DEFAULT_WHATSAPP_TEMPLATES } from "@/lib/whatsapp";
import { AttendanceClient } from "./attendance-client";

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ day?: string; circle?: string; group?: string }>;
}) {
  const { day, circle = "", group = "" } = await searchParams;
  const supabase = await createClient();

  const { data: currentSeason } = await supabase
    .from("seasons")
    .select("id, name")
    .eq("status", "current")
    .maybeSingle();

  if (!currentSeason) {
    return (
      <main className="p-(--space-8) max-w-[600px] mx-auto text-center">
        <p className="text-sm font-semibold text-ink-muted">لا يوجد موسم حالي. أنشئ موسماً أولاً من صفحة المواسم.</p>
      </main>
    );
  }

  const { data: programDays } = await supabase
    .from("program_days")
    .select("id, day_date, is_holiday, note")
    .eq("season_id", currentSeason.id)
    .order("day_date");

  const todayIso = new Date().toISOString().slice(0, 10);
  const nonHolidayDays = (programDays ?? []).filter((d) => !d.is_holiday);
  let selectedDay = programDays?.find((d) => d.id === day);
  if (!selectedDay) {
    selectedDay =
      nonHolidayDays.find((d) => d.day_date === todayIso) ??
      [...nonHolidayDays].reverse().find((d) => d.day_date <= todayIso) ??
      nonHolidayDays[0] ??
      programDays?.[0];
  }

  const { data: circles } = await supabase.from("circles").select("id, name").order("name");
  const { data: groups } = await supabase.from("groups").select("id, name").order("name");

  const { data: enrollments } = await supabase
    .from("student_season_enrollments")
    .select("student_id, circle_id, group_id, students(id, code, full_name, guardian_phone, status)")
    .eq("season_id", currentSeason.id)
    .eq("status", "active");

  let attendanceMap: Record<string, string> = {};
  if (selectedDay) {
    const { data: records } = await supabase
      .from("attendance_records")
      .select("student_id, status")
      .eq("program_day_id", selectedDay.id);
    attendanceMap = Object.fromEntries((records ?? []).map((r) => [r.student_id, r.status]));
  }

  const programInfo = await getProgramInfo(supabase);
  const { data: templates } = await supabase
    .from("whatsapp_templates")
    .select("context, body")
    .in("context", ["attendance_absent", "attendance_late"]);
  const templateMap: Record<string, string> = Object.fromEntries((templates ?? []).map((t) => [t.context, t.body]));

  const rows = (enrollments ?? [])
    .filter((e) => {
      const s = Array.isArray(e.students) ? e.students[0] : e.students;
      return s && s.status === "active" && (!circle || e.circle_id === circle) && (!group || e.group_id === group);
    })
    .map((e) => {
      const s = Array.isArray(e.students) ? e.students[0] : e.students;
      const c = circles?.find((c) => c.id === e.circle_id);
      const g = groups?.find((g) => g.id === e.group_id);
      return {
        studentId: s!.id,
        code: s!.code,
        fullName: s!.full_name,
        guardianPhone: s!.guardian_phone,
        circleName: c?.name ?? null,
        groupName: g?.name ?? null,
        status: (attendanceMap[s!.id] ?? null) as "present" | "absent" | "late" | "excused" | null,
      };
    })
    .sort((a, b) => a.fullName.localeCompare(b.fullName, "ar"));

  return (
    <AttendanceClient
      seasonName={currentSeason.name}
      seasonId={currentSeason.id}
      programDays={programDays ?? []}
      selectedDay={selectedDay ?? null}
      circles={circles ?? []}
      groups={groups ?? []}
      selectedCircle={circle}
      selectedGroup={group}
      rows={rows}
      programInfo={programInfo}
      absentTemplate={templateMap.attendance_absent ?? DEFAULT_WHATSAPP_TEMPLATES.attendance_absent}
      lateTemplate={templateMap.attendance_late ?? DEFAULT_WHATSAPP_TEMPLATES.attendance_late}
    />
  );
}
