"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushToGuardians } from "@/lib/push-notify";

async function getStudentContact(studentId: string): Promise<{ fullName: string; guardianPhone: string } | null> {
  const admin = createAdminClient();
  const { data } = await admin.from("students").select("full_name, guardian_phone").eq("id", studentId).maybeSingle();
  if (!data?.guardian_phone) return null;
  return { fullName: data.full_name, guardianPhone: data.guardian_phone };
}

export async function notifyAttendanceUpdate(studentId: string, status: "present" | "absent" | "late" | "excused") {
  const student = await getStudentContact(studentId);
  if (!student) return;

  const statusLabels: Record<string, string> = { present: "حاضر", absent: "غائب", late: "متأخر", excused: "معذور" };
  const emoji: Record<string, string> = { present: "✅", absent: "❌", late: "⏰", excused: "📋" };

  await sendPushToGuardians(
    [student.guardianPhone],
    {
      title: `تحديث حضور ${student.fullName}`,
      body: `${emoji[status]} تم تسجيل الطالب كـ ${statusLabels[status]}`,
      data: { url: "/portal", type: "attendance" },
    },
    { notificationType: "attendance", studentId }
  );
}

export async function notifyBadgeAwarded(studentId: string, badgeName: string) {
  const student = await getStudentContact(studentId);
  if (!student) return;

  await sendPushToGuardians(
    [student.guardianPhone],
    {
      title: "🏆 وسام جديد!",
      body: `حصل ${student.fullName} على وسام "${badgeName}"`,
      data: { url: "/portal", type: "badge" },
    },
    { notificationType: "badge", studentId }
  );
}

export async function notifyAchievementUnlocked(studentId: string, achievementName: string) {
  const student = await getStudentContact(studentId);
  if (!student) return;

  await sendPushToGuardians(
    [student.guardianPhone],
    {
      title: "⭐ إنجاز جديد!",
      body: `حقق ${student.fullName} إنجاز "${achievementName}"`,
      data: { url: "/portal", type: "achievement" },
    },
    { notificationType: "achievement", studentId }
  );
}

export async function notifyMonthlyResultsPublished(seasonId: string, periodLabel: string) {
  const admin = createAdminClient();
  const { data: results } = await admin
    .from("monthly_results")
    .select("percentage, status_text, students(id, full_name, guardian_phone)")
    .eq("season_id", seasonId)
    .eq("period_label", periodLabel)
    .eq("is_published", true);

  for (const row of results ?? []) {
    const student = Array.isArray(row.students) ? row.students[0] : row.students;
    if (!student?.guardian_phone) continue;

    await sendPushToGuardians(
      [student.guardian_phone],
      {
        title: `📊 نتائج ${periodLabel} متاحة`,
        body: `نتيجة ${student.full_name}: ${row.percentage !== null ? row.percentage + "%" : row.status_text}`,
        data: { url: "/portal", type: "result" },
      },
      { notificationType: "result", studentId: student.id }
    );
  }
}

export async function notifyPointsChanged(studentId: string, pointsChange: number, reason?: string) {
  const student = await getStudentContact(studentId);
  if (!student) return;

  const direction = pointsChange > 0 ? "📈" : "📉";
  const sign = pointsChange > 0 ? "+" : "";

  await sendPushToGuardians(
    [student.guardianPhone],
    {
      title: `${direction} تحديث النقاط`,
      body: `${student.fullName}: ${sign}${pointsChange} نقطة${reason ? ` (${reason})` : ""}`,
      data: { url: "/portal", type: "points" },
    },
    { notificationType: "points", studentId }
  );
}

export async function notifyNewsPublished(title: string, body: string, newsId: string) {
  const admin = createAdminClient();
  const { data: students } = await admin.from("students").select("guardian_phone").eq("status", "active");
  const phones = [...new Set((students ?? []).map((s) => s.guardian_phone).filter(Boolean))];
  if (phones.length === 0) return;

  await sendPushToGuardians(
    phones,
    {
      title,
      body: body.slice(0, 120),
      data: { url: "/", type: "news", newsId },
    },
    { notificationType: "news" }
  );
}
