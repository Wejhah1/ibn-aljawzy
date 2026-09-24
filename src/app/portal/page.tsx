import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyParentToken, PARENT_COOKIE_NAME } from "@/lib/parent-session";
import { PortalClient } from "./portal-client";

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

  const [{ data: enrollments }, { data: attendance }, { data: achievements }, { data: badges }, { data: monthlyResults }, { data: parentNotes }] =
    await Promise.all([
      currentSeason
        ? admin
            .from("student_season_enrollments")
            .select("student_id, total_points, circles(name, color_token), groups(name, color_token)")
            .in("student_id", studentIds)
            .eq("season_id", currentSeason.id)
        : Promise.resolve({ data: [] }),
      currentSeason
        ? admin.from("attendance_records").select("student_id, status").in("student_id", studentIds).eq("season_id", currentSeason.id)
        : Promise.resolve({ data: [] }),
      currentSeason
        ? admin
            .from("student_achievements")
            .select("student_id, achievements(name, icon)")
            .in("student_id", studentIds)
            .eq("season_id", currentSeason.id)
        : Promise.resolve({ data: [] }),
      currentSeason
        ? admin
            .from("student_badges")
            .select("student_id, badges(name, icon)")
            .in("student_id", studentIds)
            .eq("season_id", currentSeason.id)
        : Promise.resolve({ data: [] }),
      currentSeason
        ? admin
            .from("monthly_results")
            .select("student_id, period_label, percentage, status_text")
            .in("student_id", studentIds)
            .eq("season_id", currentSeason.id)
            .eq("is_published", true)
        : Promise.resolve({ data: [] }),
      admin
        .from("parent_notes")
        .select("id, student_id, sender, message, created_at")
        .in("student_id", studentIds)
        .order("created_at", { ascending: true }),
    ]);

  if (parentNotes?.length) {
    await admin
      .from("parent_notes")
      .update({ is_read_by_parent: true })
      .in("student_id", studentIds)
      .eq("sender", "admin")
      .eq("is_read_by_parent", false);
  }

  const studentsData = students.map((s) => {
    const enrollment = enrollments?.find((e) => e.student_id === s.id);
    const att = (attendance ?? []).filter((a) => a.student_id === s.id);
    const circle = Array.isArray(enrollment?.circles) ? enrollment?.circles[0] : enrollment?.circles;
    const group = Array.isArray(enrollment?.groups) ? enrollment?.groups[0] : enrollment?.groups;

    return {
      id: s.id,
      code: s.code,
      fullName: s.full_name,
      status: s.status,
      circleName: circle?.name ?? null,
      groupName: group?.name ?? null,
      circleColor: circle?.color_token ?? null,
      groupColor: group?.color_token ?? null,
      totalPoints: enrollment?.total_points ?? 0,
      attendance: {
        present: att.filter((a) => a.status === "present").length,
        late: att.filter((a) => a.status === "late").length,
        absent: att.filter((a) => a.status === "absent").length,
        excused: att.filter((a) => a.status === "excused").length,
      },
      achievements: (achievements ?? [])
        .filter((a) => a.student_id === s.id)
        .map((a) => {
          const ach = Array.isArray(a.achievements) ? a.achievements[0] : a.achievements;
          return { name: ach?.name ?? "" };
        }),
      badges: (badges ?? [])
        .filter((b) => b.student_id === s.id)
        .map((b) => {
          const badge = Array.isArray(b.badges) ? b.badges[0] : b.badges;
          return { name: badge?.name ?? "" };
        }),
      monthlyResults: (monthlyResults ?? [])
        .filter((m) => m.student_id === s.id)
        .map((m) => ({ periodLabel: m.period_label, percentage: m.percentage, statusText: m.status_text })),
      notes: (parentNotes ?? [])
        .filter((n) => n.student_id === s.id)
        .map((n) => ({ id: n.id, sender: n.sender, message: n.message, createdAt: n.created_at })),
    };
  });

  return <PortalClient students={studentsData} seasonName={currentSeason?.name ?? null} />;
}
