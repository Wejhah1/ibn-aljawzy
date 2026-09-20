"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type FormState = { error?: string; success?: boolean } | null;

export async function createCircleAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const name = String(formData.get("name") ?? "").trim();
  const leaderName = String(formData.get("leader_name") ?? "").trim();
  const leaderPhone = String(formData.get("leader_phone") ?? "").trim();
  const teacherName = String(formData.get("teacher_name") ?? "").trim();
  const teacherPhone = String(formData.get("teacher_phone") ?? "").trim();
  const colorToken = String(formData.get("color_token") ?? "group-1");
  const seasonId = String(formData.get("season_id") ?? "");

  if (!name) return { error: "اسم الحلقة مطلوب." };

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

  if (!id || !name) return { error: "اسم الحلقة مطلوب." };

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
    })
    .eq("id", id);

  if (error) return { error: "تعذّر تحديث الحلقة: " + error.message };

  revalidatePath("/admin/circles");
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
