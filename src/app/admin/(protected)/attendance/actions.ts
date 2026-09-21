"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sendCloudApiTextMessage } from "@/lib/whatsapp-cloud-api";
import { notifyAttendanceUpdate } from "@/app/admin/notifications-actions";

export interface AutoPointsSettings {
  isEnabled: boolean;
  pointsPresent: number;
  pointsLate: number;
  pointsExcused: number;
  pointsAbsent: number;
}

export async function getAutoPointsSettingsAction(seasonId: string): Promise<AutoPointsSettings> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("attendance_auto_points_settings")
    .select("is_enabled, points_present, points_late, points_excused, points_absent")
    .eq("season_id", seasonId)
    .maybeSingle();

  return {
    isEnabled: data?.is_enabled ?? false,
    pointsPresent: data?.points_present ?? 0,
    pointsLate: data?.points_late ?? 0,
    pointsExcused: data?.points_excused ?? 0,
    pointsAbsent: data?.points_absent ?? 0,
  };
}

export async function saveAutoPointsSettingsAction(seasonId: string, settings: AutoPointsSettings) {
  const supabase = await createClient();
  const { error } = await supabase.from("attendance_auto_points_settings").upsert(
    {
      season_id: seasonId,
      is_enabled: settings.isEnabled,
      points_present: settings.pointsPresent,
      points_late: settings.pointsLate,
      points_excused: settings.pointsExcused,
      points_absent: settings.pointsAbsent,
    },
    { onConflict: "season_id" }
  );
  revalidatePath("/admin/attendance");
  return { error: error?.message };
}

export async function setAttendanceAction(
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
  revalidatePath("/admin/attendance");
  revalidatePath("/admin");
  if (!error) notifyAttendanceUpdate(studentId, status).catch((e) => console.error("فشل إشعار الحضور:", e));
  return { error: error?.message };
}

export async function bulkMarkPresentAction(studentIds: string[], programDayId: string) {
  const supabase = await createClient();
  for (const studentId of studentIds) {
    const { error } = await supabase.rpc("mark_attendance", {
      p_student_id: studentId,
      p_program_day_id: programDayId,
      p_status: "present",
    });
    if (!error) notifyAttendanceUpdate(studentId, "present").catch((e) => console.error("فشل إشعار الحضور:", e));
  }
  revalidatePath("/admin/attendance");
  revalidatePath("/admin");
}

export interface AttendanceHistoryEntry {
  dayDate: string;
  status: "present" | "absent" | "late" | "excused" | null;
}

export async function getStudentAttendanceHistoryAction(
  studentId: string,
  seasonId: string
): Promise<AttendanceHistoryEntry[]> {
  const supabase = await createClient();
  const { data: days } = await supabase
    .from("program_days")
    .select("id, day_date")
    .eq("season_id", seasonId)
    .lte("day_date", new Date().toISOString().slice(0, 10))
    .order("day_date", { ascending: false });

  const { data: records } = await supabase
    .from("attendance_records")
    .select("program_day_id, status")
    .eq("student_id", studentId)
    .eq("season_id", seasonId);

  const statusByDay = Object.fromEntries((records ?? []).map((r) => [r.program_day_id, r.status]));

  return (days ?? []).map((d) => ({
    dayDate: d.day_date,
    status: (statusByDay[d.id] ?? null) as AttendanceHistoryEntry["status"],
  }));
}

export interface BulkWhatsappItem {
  studentId: string;
  phone: string;
  message: string;
}

export interface BulkWhatsappResult {
  fallback: boolean;
  sent: string[];
  failed: { studentId: string; error: string }[];
}

/**
 * يحاول الإرسال الفعلي عبر WhatsApp Cloud API إن كان مفعّلاً ومهيّأً بمفاتيح صالحة.
 * إن كان معطّلاً أو غير مهيّأ، يُرجع fallback=true ليتولى العميل فتح روابط wa.me يدوياً.
 */
export async function bulkSendWhatsappAction(items: BulkWhatsappItem[]): Promise<BulkWhatsappResult> {
  const supabase = await createClient();
  const { data: setting } = await supabase
    .from("app_settings")
    .select("value")
    .eq("category", "whatsapp")
    .eq("key", "cloud_api_enabled")
    .maybeSingle();

  const enabled = Boolean(setting?.value) && Boolean(process.env.WHATSAPP_CLOUD_API_TOKEN);
  if (!enabled) return { fallback: true, sent: [], failed: [] };

  const sent: string[] = [];
  const failed: { studentId: string; error: string }[] = [];

  for (const item of items) {
    const result = await sendCloudApiTextMessage(item.phone, item.message);
    if (result.ok) sent.push(item.studentId);
    else failed.push({ studentId: item.studentId, error: result.error ?? "فشل الإرسال" });
  }

  return { fallback: false, sent, failed };
}
