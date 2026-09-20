import { createClient } from "@/lib/supabase/server";
import { getProgramInfo } from "@/lib/settings";
import { DEFAULT_WHATSAPP_TEMPLATES } from "@/lib/whatsapp";
import { StudentsListClient } from "./students-list-client";

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; circle?: string }>;
}) {
  const { q = "", status = "active", circle = "" } = await searchParams;
  const supabase = await createClient();

  const { data: currentSeason } = await supabase
    .from("seasons")
    .select("id")
    .eq("status", "current")
    .maybeSingle();

  const { data: circles } = await supabase.from("circles").select("id, name, color_token").order("name");
  const circleColorById = new Map((circles ?? []).map((c) => [c.id, c.color_token]));

  let query = supabase
    .from("students")
    .select(
      "id, code, full_name, guardian_name, guardian_phone, status, student_season_enrollments(season_id, circle_id, total_points, circles(name, color_token), groups(name, color_token))"
    )
    .order("full_name");

  if (status !== "all") query = query.eq("status", status as "active" | "dropped_out");
  if (q) query = query.or(`full_name.ilike.%${q}%,code.eq.${q},guardian_phone.ilike.%${q}%`);

  const { data: students } = await query;

  const filtered = (students ?? []).filter((s) => {
    if (!circle) return true;
    return s.student_season_enrollments.some(
      (e) => e.season_id === currentSeason?.id && e.circle_id === circle
    );
  });

  const [{ data: unreadNotes }, { data: attendanceRows }, { data: badgeRows }] = await Promise.all([
    supabase.from("parent_notes").select("student_id").eq("sender", "parent").eq("is_read_by_admin", false),
    currentSeason
      ? supabase.from("attendance_records").select("student_id, status").eq("season_id", currentSeason.id)
      : Promise.resolve({ data: [] as { student_id: string; status: string }[] }),
    currentSeason
      ? supabase
          .from("student_badges")
          .select("student_id, awarded_at, badges(name, icon, display_duration_days)")
          .eq("season_id", currentSeason.id)
      : Promise.resolve({ data: [] as never[] }),
  ]);

  const unreadStudentIds = new Set((unreadNotes ?? []).map((n) => n.student_id));

  const attendanceByStudent = new Map<string, { present: number; absent: number }>();
  for (const r of attendanceRows ?? []) {
    const entry = attendanceByStudent.get(r.student_id) ?? { present: 0, absent: 0 };
    if (r.status === "present" || r.status === "late") entry.present += 1;
    if (r.status === "absent") entry.absent += 1;
    attendanceByStudent.set(r.student_id, entry);
  }

  const now = Date.now();
  const badgesByStudent = new Map<string, { name: string; icon: string | null }[]>();
  for (const r of (badgeRows ?? []) as {
    student_id: string;
    awarded_at: string;
    badges: { name: string; icon: string | null; display_duration_days: number | null } | { name: string; icon: string | null; display_duration_days: number | null }[] | null;
  }[]) {
    const b = Array.isArray(r.badges) ? r.badges[0] : r.badges;
    if (!b) continue;
    if (b.display_duration_days) {
      const ageDays = (now - new Date(r.awarded_at).getTime()) / 86400000;
      if (ageDays > b.display_duration_days) continue;
    }
    const list = badgesByStudent.get(r.student_id) ?? [];
    list.push({ name: b.name, icon: b.icon });
    badgesByStudent.set(r.student_id, list);
  }

  const programInfo = await getProgramInfo(supabase);
  const { data: templateRow } = await supabase
    .from("whatsapp_templates")
    .select("body")
    .eq("context", "students_list_contact")
    .maybeSingle();
  const template = templateRow?.body ?? DEFAULT_WHATSAPP_TEMPLATES.students_list_contact;

  const rows = filtered.map((s) => {
    const enrollment = s.student_season_enrollments.find((e) => e.season_id === currentSeason?.id);
    const circleObj = Array.isArray(enrollment?.circles) ? enrollment?.circles[0] : (enrollment?.circles as { name: string; color_token: string } | null);
    const groupObj = Array.isArray(enrollment?.groups) ? enrollment?.groups[0] : (enrollment?.groups as { name: string; color_token: string } | null);
    const attendance = attendanceByStudent.get(s.id) ?? { present: 0, absent: 0 };
    return {
      id: s.id,
      code: s.code,
      fullName: s.full_name,
      guardianName: s.guardian_name,
      guardianPhone: s.guardian_phone,
      status: s.status,
      circleName: circleObj?.name ?? null,
      circleColor: circleObj?.color_token ?? (enrollment?.circle_id ? circleColorById.get(enrollment.circle_id) ?? null : null),
      groupName: groupObj?.name ?? null,
      groupColor: groupObj?.color_token ?? null,
      points: enrollment?.total_points ?? 0,
      presentCount: attendance.present,
      absentCount: attendance.absent,
      hasUnreadNote: unreadStudentIds.has(s.id),
      badges: badgesByStudent.get(s.id) ?? [],
    };
  });

  return (
    <StudentsListClient
      rows={rows}
      circles={circles ?? []}
      q={q}
      status={status}
      circle={circle}
      programInfo={programInfo}
      template={template}
    />
  );
}
