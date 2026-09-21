"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { notifyAchievementUnlocked, notifyBadgeAwarded } from "@/app/admin/notifications-actions";

export type FormState = { error?: string; success?: boolean } | null;

function parseDuration(formData: FormData): number | null {
  const raw = String(formData.get("display_duration_days") ?? "").trim();
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export async function upsertAchievementAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const icon = String(formData.get("icon") ?? "").trim();
  const pointsAwarded = Number(formData.get("points_awarded") ?? 0);
  const displayDurationDays = parseDuration(formData);

  if (!name) return { error: "الاسم مطلوب." };

  const supabase = await createClient();
  const payload = {
    name,
    description: description || null,
    icon: icon || null,
    points_awarded: pointsAwarded,
    display_duration_days: displayDurationDays,
  };
  const { error } = id
    ? await supabase.from("achievements").update(payload).eq("id", id)
    : await supabase.from("achievements").insert(payload);

  if (error) return { error: error.message };
  revalidatePath("/admin/achievements");
  return { success: true };
}

export async function upsertBadgeAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const icon = String(formData.get("icon") ?? "").trim();
  const displayDurationDays = parseDuration(formData);

  if (!name) return { error: "الاسم مطلوب." };

  const supabase = await createClient();
  const payload = {
    name,
    description: description || null,
    icon: icon || null,
    color_token: "accent",
    display_duration_days: displayDurationDays,
  };
  const { error } = id
    ? await supabase.from("badges").update(payload).eq("id", id)
    : await supabase.from("badges").insert(payload);

  if (error) return { error: error.message };
  revalidatePath("/admin/achievements");
  return { success: true };
}

export async function upsertFlagAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const severity = String(formData.get("severity") ?? "info") as "info" | "warning" | "critical";
  const requiresAction = formData.get("requires_action") === "on";
  const displayDurationDays = parseDuration(formData);

  if (!name) return { error: "الاسم مطلوب." };

  const supabase = await createClient();
  const payload = {
    name,
    description: description || null,
    severity,
    requires_action: requiresAction,
    display_duration_days: displayDurationDays,
  };
  const { error } = id
    ? await supabase.from("flags").update(payload).eq("id", id)
    : await supabase.from("flags").insert(payload);

  if (error) return { error: error.message };
  revalidatePath("/admin/achievements");
  return { success: true };
}

export async function toggleActiveAction(table: "achievements" | "badges" | "flags", id: string, isActive: boolean) {
  const supabase = await createClient();
  await supabase.from(table).update({ is_active: isActive }).eq("id", id);
  revalidatePath("/admin/achievements");
}

export async function searchStudentsAction(query: string) {
  const supabase = await createClient();
  if (!query.trim()) return [];
  const { data } = await supabase
    .from("students")
    .select("id, full_name, code")
    .eq("status", "active")
    .or(`full_name.ilike.%${query}%,code.eq.${query}`)
    .limit(10);
  return data ?? [];
}

async function getCurrentSeasonId(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data } = await supabase.from("seasons").select("id").eq("status", "current").maybeSingle();
  return data?.id ?? null;
}

export async function grantAchievementAction(studentId: string, achievementId: string) {
  const supabase = await createClient();
  const seasonId = await getCurrentSeasonId(supabase);
  if (!seasonId) return { error: "لا يوجد موسم حالي." };

  const { data: achievement } = await supabase
    .from("achievements")
    .select("name, points_awarded")
    .eq("id", achievementId)
    .single();

  const { error } = await supabase
    .from("student_achievements")
    .insert({ student_id: studentId, season_id: seasonId, achievement_id: achievementId });
  if (error) return { error: error.message };

  if (achievement?.points_awarded) {
    await supabase.rpc("add_manual_points", {
      p_student_id: studentId,
      p_season_id: seasonId,
      p_points: achievement.points_awarded,
      p_reason: "إنجاز",
    });
  }

  if (achievement?.name) notifyAchievementUnlocked(studentId, achievement.name).catch((e) => console.error("فشل إشعار الإنجاز:", e));

  revalidatePath(`/admin/students/${studentId}`);
  revalidatePath("/admin/leaderboard");
  return { success: true };
}

export async function grantBadgeAction(studentId: string, badgeId: string) {
  const supabase = await createClient();
  const seasonId = await getCurrentSeasonId(supabase);
  if (!seasonId) return { error: "لا يوجد موسم حالي." };

  const { error } = await supabase.from("student_badges").insert({ student_id: studentId, season_id: seasonId, badge_id: badgeId });
  if (!error) {
    const { data: badge } = await supabase.from("badges").select("name").eq("id", badgeId).maybeSingle();
    if (badge?.name) notifyBadgeAwarded(studentId, badge.name).catch((e) => console.error("فشل إشعار الوسام:", e));
  }
  revalidatePath(`/admin/students/${studentId}`);
  revalidatePath("/admin/leaderboard");
  return { error: error?.message };
}

export async function grantFlagAction(studentId: string, flagId: string) {
  const supabase = await createClient();
  const seasonId = await getCurrentSeasonId(supabase);

  const { error } = await supabase.from("student_flags").insert({ student_id: studentId, season_id: seasonId, flag_id: flagId });
  revalidatePath(`/admin/students/${studentId}`);
  revalidatePath("/admin");
  return { error: error?.message };
}
