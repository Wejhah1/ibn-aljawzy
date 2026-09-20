"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sendCloudApiTextMessage } from "@/lib/whatsapp-cloud-api";

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
  return { error: error?.message };
}

export async function bulkMarkPresentAction(studentIds: string[], programDayId: string) {
  const supabase = await createClient();
  for (const studentId of studentIds) {
    await supabase.rpc("mark_attendance", {
      p_student_id: studentId,
      p_program_day_id: programDayId,
      p_status: "present",
    });
  }
  revalidatePath("/admin/attendance");
  revalidatePath("/admin");
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
