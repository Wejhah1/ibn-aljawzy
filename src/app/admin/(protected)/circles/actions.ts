"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushToGuardians } from "@/lib/push-notify";
import { REMOTE_STUDY_SETTING, getRemoteStudyEnabled } from "@/lib/settings";

export type FormState = { error?: string; success?: boolean } | null;

const MEETING_URL_ERROR = "رابط الحلقة الافتراضية يجب أن يبدأ بـ https://";

/** يعيد الرابط، أو null إذا كان فارغاً، أو false إذا كان غير صالح. */
function parseMeetingUrl(formData: FormData): string | null | false {
  const raw = String(formData.get("meeting_url") ?? "").trim();
  if (!raw) return null;
  try {
    const url = new URL(raw);
    return url.protocol === "https:" ? url.toString() : false;
  } catch {
    return false;
  }
}

export async function createCircleAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const name = String(formData.get("name") ?? "").trim();
  const leaderName = String(formData.get("leader_name") ?? "").trim();
  const leaderPhone = String(formData.get("leader_phone") ?? "").trim();
  const teacherName = String(formData.get("teacher_name") ?? "").trim();
  const teacherPhone = String(formData.get("teacher_phone") ?? "").trim();
  const colorToken = String(formData.get("color_token") ?? "group-1");
  const seasonId = String(formData.get("season_id") ?? "");
  const meetingUrl = parseMeetingUrl(formData);

  if (!name) return { error: "اسم الحلقة مطلوب." };
  if (meetingUrl === false) return { error: MEETING_URL_ERROR };

  const supabase = await createClient();
  const { data: circle, error } = await supabase
    .from("circles")
    .insert({
      name,
      leader_name: leaderName || null,
      leader_phone: leaderPhone || null,
      teacher_name: teacherName || null,
      teacher_phone: teacherPhone || null,
      color_token: colorToken,
      meeting_url: meetingUrl,
      season_id: seasonId || null,
    })
    .select("id")
    .single();

  if (error) return { error: "تعذّر إنشاء الحلقة: " + error.message };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  await supabase.from("audit_log").insert({
    actor_id: user?.id,
    action: "circle.create",
    entity_type: "circle",
    entity_id: circle.id,
    metadata: { name },
  });

  revalidatePath("/admin/circles");
  return { success: true };
}

export async function updateCircleAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const leaderName = String(formData.get("leader_name") ?? "").trim();
  const leaderPhone = String(formData.get("leader_phone") ?? "").trim();
  const teacherName = String(formData.get("teacher_name") ?? "").trim();
  const teacherPhone = String(formData.get("teacher_phone") ?? "").trim();
  const colorToken = String(formData.get("color_token") ?? "group-1");
  const meetingUrl = parseMeetingUrl(formData);

  if (!id || !name) return { error: "اسم الحلقة مطلوب." };
  if (meetingUrl === false) return { error: MEETING_URL_ERROR };

  const supabase = await createClient();
  const { error } = await supabase
    .from("circles")
    .update({
      name,
      leader_name: leaderName || null,
      leader_phone: leaderPhone || null,
      teacher_name: teacherName || null,
      teacher_phone: teacherPhone || null,
      color_token: colorToken,
      meeting_url: meetingUrl,
    })
    .eq("id", id);

  if (error) return { error: "تعذّر تحديث الحلقة: " + error.message };

  revalidatePath("/admin/circles");
  revalidatePath("/portal");
  return { success: true };
}

export async function createGroupAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const name = String(formData.get("name") ?? "").trim();
  const leaderName = String(formData.get("leader_name") ?? "").trim();
  const leaderPhone = String(formData.get("leader_phone") ?? "").trim();
  const colorToken = String(formData.get("color_token") ?? "group-1");

  if (!name) return { error: "اسم المجموعة مطلوب." };

  const supabase = await createClient();
  const { error } = await supabase.from("groups").insert({
    name,
    leader_name: leaderName || null,
    leader_phone: leaderPhone || null,
    color_token: colorToken,
  });

  if (error) return { error: "تعذّر إنشاء المجموعة: " + error.message };

  revalidatePath("/admin/circles");
  return { success: true };
}

export async function updateGroupAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const leaderName = String(formData.get("leader_name") ?? "").trim();
  const leaderPhone = String(formData.get("leader_phone") ?? "").trim();
  const colorToken = String(formData.get("color_token") ?? "group-1");

  if (!id || !name) return { error: "اسم المجموعة مطلوب." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("groups")
    .update({ name, leader_name: leaderName || null, leader_phone: leaderPhone || null, color_token: colorToken })
    .eq("id", id);

  if (error) return { error: "تعذّر تحديث المجموعة: " + error.message };

  revalidatePath("/admin/circles");
  return { success: true };
}

export async function toggleCircleActiveAction(id: string, isActive: boolean) {
  const supabase = await createClient();
  await supabase.from("circles").update({ is_active: isActive }).eq("id", id);
  revalidatePath("/admin/circles");
}

export async function deleteCircleAction(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("circles").delete().eq("id", id);
  revalidatePath("/admin/circles");
  return { error: error?.message };
}

export async function deleteGroupAction(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("groups").delete().eq("id", id);
  revalidatePath("/admin/circles");
  return { error: error?.message };
}

export async function getRosterAction(kind: "circle" | "group", id: string) {
  const supabase = await createClient();
  const { data: currentSeason } = await supabase.from("seasons").select("id").eq("status", "current").maybeSingle();
  if (!currentSeason) return { students: [] as { full_name: string; code: string }[] };

  const column = kind === "circle" ? "circle_id" : "group_id";
  const { data } = await supabase
    .from("student_season_enrollments")
    .select("students(full_name, code)")
    .eq(column, id)
    .eq("season_id", currentSeason.id)
    .eq("status", "active");

  const students = (data ?? [])
    .map((r) => (Array.isArray(r.students) ? r.students[0] : r.students))
    .filter((s): s is { full_name: string; code: string } => !!s)
    .sort((a, b) => a.full_name.localeCompare(b.full_name, "ar"));

  return { students };
}

// ---------- الدراسة عن بعد ----------

async function logAudit(action: string, entityId: string | null, metadata: { [key: string]: Json }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  await supabase.from("audit_log").insert({
    actor_id: user?.id,
    action,
    entity_type: "circle",
    entity_id: entityId,
    metadata,
  });
}

/** يرسل إشعار "الدرس اليوم عن بعد" لأولياء أمور منتسبي الحلقات المحددة في الموسم الحالي. */
async function notifyRemoteClass(circleIds: string[]) {
  if (circleIds.length === 0) return;
  const admin = createAdminClient();
  const { data: currentSeason } = await admin.from("seasons").select("id").eq("status", "current").maybeSingle();
  if (!currentSeason) return;

  const [{ data: circles }, { data: enrollments }] = await Promise.all([
    admin.from("circles").select("id, name").in("id", circleIds),
    admin
      .from("student_season_enrollments")
      .select("circle_id, students(guardian_phone)")
      .in("circle_id", circleIds)
      .eq("season_id", currentSeason.id)
      .eq("status", "active"),
  ]);

  for (const circle of circles ?? []) {
    const phones = (enrollments ?? [])
      .filter((e) => e.circle_id === circle.id)
      .map((e) => (Array.isArray(e.students) ? e.students[0] : e.students)?.guardian_phone)
      .filter((p): p is string => !!p);

    await sendPushToGuardians(
      phones,
      {
        title: "📹 الدرس اليوم عن بعد",
        body: `${circle.name}: ادخل بوابة ولي الأمر واضغط على رابط الحلقة الافتراضية`,
        data: { url: "/portal", type: "remote" },
      },
      { notificationType: "remote" }
    );
  }
}

export async function setCircleRemoteAction(circleId: string, active: boolean) {
  const supabase = await createClient();
  // التحديث عبر عميل المستخدم (RLS: فريق الإدارة فقط) — إن لم يُرجع صفاً فالمستخدم غير مصرّح
  const { data: circle, error } = await supabase
    .from("circles")
    .update({ remote_active: active })
    .eq("id", circleId)
    .select("id, name, meeting_url")
    .maybeSingle();

  if (error) return { error: "تعذّر تحديث الحلقة: " + error.message };
  if (!circle) return { error: "غير مصرّح" };

  await logAudit(active ? "circle.remote_on" : "circle.remote_off", circle.id, { name: circle.name });

  // لا حاجة لإشعار إذا كان الرابط ظاهراً أصلاً بسبب المفتاح العام
  if (active && circle.meeting_url && !(await getRemoteStudyEnabled(supabase))) {
    await notifyRemoteClass([circle.id]);
  }

  revalidatePath("/admin/circles");
  revalidatePath("/portal");
  return { error: undefined };
}

export async function setGlobalRemoteAction(enabled: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: row, error } = await supabase
    .from("app_settings")
    .upsert(
      { ...REMOTE_STUDY_SETTING, value: enabled, updated_by: user?.id ?? null },
      { onConflict: "category,key" }
    )
    .select("id")
    .maybeSingle();

  if (error) return { error: "تعذّر حفظ الإعداد: " + error.message };
  if (!row) return { error: "غير مصرّح" };

  await logAudit(enabled ? "remote_study.on" : "remote_study.off", null, {});

  if (enabled) {
    // الحلقات المفعّلة لحالها وصلها إشعار مسبقاً
    const { data: circles } = await supabase
      .from("circles")
      .select("id")
      .eq("remote_active", false)
      .not("meeting_url", "is", null);
    await notifyRemoteClass((circles ?? []).map((c) => c.id));
  }

  revalidatePath("/admin/circles");
  revalidatePath("/portal");
  return { error: undefined };
}
