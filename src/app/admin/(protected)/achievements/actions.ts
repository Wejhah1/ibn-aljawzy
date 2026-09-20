"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type FormState = { error?: string; success?: boolean } | null;

export async function upsertAchievementAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const icon = String(formData.get("icon") ?? "").trim();
  const pointsAwarded = Number(formData.get("points_awarded") ?? 0);

  if (!name) return { error: "الاسم مطلوب." };

  const supabase = await createClient();
  const payload = { name, description: description || null, icon: icon || null, points_awarded: pointsAwarded };
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

  if (!name) return { error: "الاسم مطلوب." };

  const supabase = await createClient();
  const payload = { name, description: description || null, icon: icon || null, color_token: "accent" };
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

  if (!name) return { error: "الاسم مطلوب." };

  const supabase = await createClient();
  const payload = { name, description: description || null, severity, requires_action: requiresAction };
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
