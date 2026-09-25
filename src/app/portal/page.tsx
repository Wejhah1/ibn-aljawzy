import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyParentToken, PARENT_COOKIE_NAME } from "@/lib/parent-session";
import { PortalClient, type StudentData, type AttendanceStatus } from "./portal-client";

function one<T>(v: T | T[] | null | undefined): T | null {
  if (!v) return null;
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

const SOURCE_LABEL: Record<string, string> = {
  manual: "نقاط من المعلم",
  auto_attendance: "نقاط الحضور",
  achievement: "إنجاز جديد",
  adjustment: "تعديل على النقاط",
};

export default async function ParentPortalPage() {
  const cookieStore = await cookies();
  const session = verifyParentToken(cookieStore.get(PARENT_COOKIE_NAME)?.value);
  if (!session) redirect("/portal/login");

  const admin = createAdminClient();

  const { data: students } = await admin
    .from("students")
    .select("id, code, full_name, guardian_phone, status, photo_url")
    .eq("guardian_phone", session.phone);

  if (!students || students.length === 0) redirect("/portal/login");

  const { data: currentSeason } = await admin.from("seasons").select("id, name").eq("status", "current").maybeSingle();

  const studentIds = students.map((s) => s.id);
  const seasonId = currentSeason?.id;
  const empty = Promise.resolve({ data: [] });

  const [
    { data: enrollments },
    { data: attendance },
    { data: achievements },
    { data: badges },
    { data: monthlyResults },
    { data: parentNotes },
    { data: transactions },
    { data: allBadges },
  ] = await Promise.all([
    seasonId
      ? admin
          .from("student_season_enrollments")
          .select("student_id, circle_id, total_points, circles(name, color_token), groups(name, color_token)")
          .in("student_id", studentIds)
          .eq("season_id", seasonId)
      : empty,
    seasonId
      ? admin
          .from("attendance_records")
          .select("student_id, status, program_days(day_date)")
          .in("student_id", studentIds)
          .eq("season_id", seasonId)
      : empty,
    seasonId
      ? admin
          .from("student_achievements")
          .select("student_id, achievements(name, icon)")
          .in("student_id", studentIds)
          .eq("season_id", seasonId)
      : empty,
    seasonId
      ? admin
          .from("student_badges")
          .select("student_id, badges(id, name, icon)")
          .in("student_id", studentIds)
          .eq("season_id", seasonId)
      : empty,
    seasonId
      ? admin
          .from("monthly_results")
          .select("student_id, period_label, percentage, status_text")
          .in("student_id", studentIds)
          .eq("season_id", seasonId)
          .eq("is_published", true)
      : empty,
    admin
      .from("parent_notes")
      .select("id, student_id, sender, message, created_at, is_read_by_parent")
      .in("student_id", studentIds)
      .order("created_at", { ascending: true }),
    seasonId
      ? admin
          .from("point_transactions")
          .select("id, student_id, points, source, reason, created_at")
          .in("student_id", studentIds)
          .eq("season_id", seasonId)
          .order("created_at", { ascending: false })
          .limit(30 * studentIds.length)
      : empty,
    admin.from("badges").select("id, name, icon").eq("is_active", true).order("name"),
  ]);

  // ترتيب الطالب داخل حلقته: يحتاج نقاط زملائه في نفس الحلقة
  const circleIds = [...new Set((enrollments ?? []).map((e) => e.circle_id).filter((id): id is string => !!id))];
  const { data: circleMates } =
    seasonId && circleIds.length
      ? await admin
          .from("student_season_enrollments")
          .select("circle_id, total_points")
          .in("circle_id", circleIds)
          .eq("season_id", seasonId)
          .eq("status", "active")
      : { data: [] as { circle_id: string | null; total_points: number }[] };

  if (parentNotes?.length) {
    await admin
      .from("parent_notes")
      .update({ is_read_by_parent: true })
      .in("student_id", studentIds)
      .eq("sender", "admin")
      .eq("is_read_by_parent", false);
  }

  const studentsData: StudentData[] = students.map((s) => {
    const enrollment = enrollments?.find((e) => e.student_id === s.id);
    const circle = one(enrollment?.circles);
    const group = one(enrollment?.groups);
    const totalPoints = enrollment?.total_points ?? 0;

    const att = (attendance ?? [])
      .filter((a) => a.student_id === s.id)
      .map((a) => ({ status: a.status as AttendanceStatus, date: one(a.program_days)?.day_date ?? null }))
      .sort((a, b) => (a.date ?? "").localeCompare(b.date ?? ""));
    const count = (st: AttendanceStatus) => att.filter((a) => a.status === st).length;

    const mates = enrollment?.circle_id ? (circleMates ?? []).filter((m) => m.circle_id === enrollment.circle_id) : [];
    const circleRank = mates.length ? mates.filter((m) => m.total_points > totalPoints).length + 1 : null;

    const earnedBadges = (badges ?? [])
      .filter((b) => b.student_id === s.id)
      .map((b) => one(b.badges))
      .filter((b): b is NonNullable<typeof b> => !!b);
    const earnedBadgeIds = new Set(earnedBadges.map((b) => b.id));

    return {
      id: s.id,
      code: s.code,
      fullName: s.full_name,
      photoUrl: s.photo_url,
      status: s.status,
      circleName: circle?.name ?? null,
      groupName: group?.name ?? null,
      circleColor: circle?.color_token ?? null,
      groupColor: group?.color_token ?? null,
      totalPoints,
      circleRank,
      circleSize: mates.length || null,
      attendance: {
        present: count("present"),
        late: count("late"),
        absent: count("absent"),
        excused: count("excused"),
      },
      recentDays: att.slice(-14),
      lastAbsenceDate: [...att].reverse().find((a) => a.status === "absent")?.date ?? null,
      achievements: (achievements ?? [])
        .filter((a) => a.student_id === s.id)
        .map((a) => one(a.achievements))
        .filter((a): a is NonNullable<typeof a> => !!a)
        .map((a) => ({ name: a.name, icon: a.icon })),
      badges: earnedBadges.map((b) => ({ name: b.name, icon: b.icon })),
      lockedBadges: (allBadges ?? []).filter((b) => !earnedBadgeIds.has(b.id)).map((b) => ({ name: b.name, icon: b.icon })),
      monthlyResults: (monthlyResults ?? [])
        .filter((m) => m.student_id === s.id)
        .map((m) => ({ periodLabel: m.period_label, percentage: m.percentage, statusText: m.status_text })),
      pointsLog: (transactions ?? [])
        .filter((t) => t.student_id === s.id)
        .slice(0, 30)
        .map((t) => ({
          id: t.id,
          points: t.points,
          label: t.reason?.trim() || SOURCE_LABEL[t.source] || "نقاط",
          createdAt: t.created_at,
        })),
      notes: (parentNotes ?? [])
        .filter((n) => n.student_id === s.id)
        .map((n) => ({ id: n.id, sender: n.sender, message: n.message, createdAt: n.created_at })),
      unreadAdminNotes: (parentNotes ?? []).filter((n) => n.student_id === s.id && n.sender === "admin" && !n.is_read_by_parent)
        .length,
    };
  });

  return <PortalClient students={studentsData} seasonName={currentSeason?.name ?? null} />;
}
