"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getProgramInfo } from "@/lib/settings";
import { DEFAULT_WHATSAPP_TEMPLATES } from "@/lib/whatsapp";

export interface StudentSearchResult {
  id: string;
  code: string;
  full_name: string;
  guardian_phone: string;
  status: string;
  circle_name: string | null;
}

export async function searchStudentsAction(query: string): Promise<StudentSearchResult[]> {
  const supabase = await createClient();
  const trimmed = query.trim();
  if (!trimmed) return [];

  const { data: currentSeason } = await supabase.from("seasons").select("id").eq("status", "current").maybeSingle();

  const { data } = await supabase
    .from("students")
    .select(
      "id, code, full_name, guardian_phone, status, student_season_enrollments(season_id, circles(name))"
    )
    .or(`full_name.ilike.%${trimmed}%,code.eq.${trimmed},guardian_phone.ilike.%${trimmed}%`)
    .eq("status", "active")
    .limit(15);

  return (data ?? []).map((s) => {
    const enrollment = s.student_season_enrollments.find((e) => e.season_id === currentSeason?.id);
    const circle = Array.isArray(enrollment?.circles) ? enrollment?.circles[0] : enrollment?.circles;
    return {
      id: s.id,
      code: s.code,
      full_name: s.full_name,
      guardian_phone: s.guardian_phone,
      status: s.status,
      circle_name: (circle as { name: string } | null)?.name ?? null,
    };
  });
}

export interface QuickCardData {
  student: {
    id: string;
    code: string;
    full_name: string;
    guardian_phone: string;
    status: string;
  };
  seasonId: string | null;
  seasonName: string | null;
  circleName: string | null;
  groupName: string | null;
  totalPoints: number;
  programDayId: string | null;
  todayStatus: string | null;
  waLink: string;
  hasUnreadNote: boolean;
}

export async function getStudentQuickCardAction(studentId: string): Promise<QuickCardData | null> {
  const supabase = await createClient();

  const { data: student } = await supabase
    .from("students")
    .select("id, code, full_name, guardian_phone, status")
    .eq("id", studentId)
    .single();
  if (!student) return null;

  const { data: currentSeason } = await supabase.from("seasons").select("id, name").eq("status", "current").maybeSingle();

  let circleName: string | null = null;
  let groupName: string | null = null;
  let totalPoints = 0;

  if (currentSeason) {
    const { data: enrollment } = await supabase
      .from("student_season_enrollments")
      .select("total_points, circles(name), groups(name)")
      .eq("student_id", studentId)
      .eq("season_id", currentSeason.id)
      .maybeSingle();
    if (enrollment) {
      totalPoints = enrollment.total_points;
      circleName = (Array.isArray(enrollment.circles) ? enrollment.circles[0] : enrollment.circles)?.name ?? null;
      groupName = (Array.isArray(enrollment.groups) ? enrollment.groups[0] : enrollment.groups)?.name ?? null;
    }
  }

  let programDayId: string | null = null;
  let todayStatus: string | null = null;

  if (currentSeason) {
    const today = new Date().toISOString().slice(0, 10);
    const { data: programDay } = await supabase
      .from("program_days")
      .select("id")
      .eq("season_id", currentSeason.id)
      .eq("day_date", today)
      .eq("is_holiday", false)
      .maybeSingle();

    if (programDay) {
      programDayId = programDay.id;
      const { data: attendance } = await supabase
        .from("attendance_records")
        .select("status")
        .eq("student_id", studentId)
        .eq("program_day_id", programDay.id)
        .maybeSingle();
      todayStatus = attendance?.status ?? null;
    }
  }

  const [{ data: templateRow }, programInfo, { data: unread }] = await Promise.all([
    supabase.from("whatsapp_templates").select("body").eq("context", "quick_ops_contact").maybeSingle(),
    getProgramInfo(supabase),
    supabase.from("parent_notes").select("id").eq("student_id", studentId).eq("sender", "parent").eq("is_read_by_admin", false).limit(1),
  ]);
  const template = templateRow?.body ?? DEFAULT_WHATSAPP_TEMPLATES.quick_ops_contact;
  const message = fillTemplateLocal(template, {
    name: student.full_name,
    program: programInfo.program_name,
    mosque: programInfo.mosque_name,
    circle: circleName ?? "",
  });
  const waLink = `https://wa.me/${toIntlPhone(student.guardian_phone)}?text=${encodeURIComponent(message)}`;

  return {
    student,
    seasonId: currentSeason?.id ?? null,
    seasonName: currentSeason?.name ?? null,
    circleName,
    groupName,
    totalPoints,
    programDayId,
    todayStatus,
    waLink,
    hasUnreadNote: (unread?.length ?? 0) > 0,
  };
}

function fillTemplateLocal(body: string, vars: Record<string, string>) {
  return body.replace(/\{(\w+)\}/g, (match, key: string) => vars[key] ?? match);
}

function toIntlPhone(phone: string, defaultCountryCode = "966") {
  const digits = phone.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return digits.slice(1);
  if (digits.startsWith("00")) return digits.slice(2);
  if (digits.startsWith("0")) return defaultCountryCode + digits.slice(1);
  if (digits.startsWith(defaultCountryCode)) return digits;
  return defaultCountryCode + digits;
}

export interface QuickBadgeOption {
  id: string;
  name: string;
  icon: string | null;
}

export async function getActiveBadgesAction(): Promise<QuickBadgeOption[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("badges").select("id, name, icon").eq("is_active", true).order("name");
  return data ?? [];
}

export async function quickGrantBadgeAction(studentId: string, badgeId: string) {
  const supabase = await createClient();
  const { data: currentSeason } = await supabase.from("seasons").select("id").eq("status", "current").maybeSingle();
  if (!currentSeason) return { error: "لا يوجد موسم حالي." };
  const { error } = await supabase
    .from("student_badges")
    .insert({ student_id: studentId, season_id: currentSeason.id, badge_id: badgeId });
  revalidatePath("/admin/quick-ops");
  return { error: error?.message };
}

export async function quickSendNoteAction(studentId: string, message: string) {
  const supabase = await createClient();
  const trimmed = message.trim();
  if (!trimmed) return { error: "الرسالة فارغة" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { error } = await supabase
    .from("parent_notes")
    .insert({ student_id: studentId, sender: "admin", sender_profile_id: user?.id, message: trimmed, is_read_by_admin: true });
  revalidatePath("/admin/quick-ops");
  return { error: error?.message };
}

export async function quickMarkAttendanceAction(
  studentId: string,
  programDayId: string,
  status: "present" | "absent" | "late" | "excused"
) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("mark_attendance", {
    p_student_id: studentId,
    p_program_day_id: programDayId,
    p_status: status,
  });
  revalidatePath("/admin/quick-ops");
  revalidatePath("/admin");
  if (error) return { error: error.message, data: null };
  return { error: undefined, data: await getStudentQuickCardAction(studentId) };
}

export async function quickAddPointsAction(studentId: string, seasonId: string, points: number, reason?: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("add_manual_points", {
    p_student_id: studentId,
    p_season_id: seasonId,
    p_points: points,
    p_reason: reason,
  });
  revalidatePath("/admin/quick-ops");
  if (error) return { error: error.message, data: null };
  return { error: undefined, data: await getStudentQuickCardAction(studentId) };
}
