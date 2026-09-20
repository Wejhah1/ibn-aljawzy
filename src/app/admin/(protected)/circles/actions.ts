"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type FormState = { error?: string; success?: boolean } | null;

export async function createCircleAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const name = String(formData.get("name") ?? "").trim();
  const leaderName = String(formData.get("leader_name") ?? "").trim();
  const leaderPhone = String(formData.get("leader_phone") ?? "").trim();
  const seasonId = String(formData.get("season_id") ?? "");

  if (!name) return { error: "اسم الحلقة مطلوب." };

  const supabase = await createClient();
  const { data: circle, error } = await supabase
    .from("circles")
    .insert({
      name,
      leader_name: leaderName || null,
      leader_phone: leaderPhone || null,
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

  if (!id || !name) return { error: "اسم الحلقة مطلوب." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("circles")
    .update({ name, leader_name: leaderName || null, leader_phone: leaderPhone || null })
    .eq("id", id);

  if (error) return { error: "تعذّر تحديث الحلقة: " + error.message };

  revalidatePath("/admin/circles");
  return { success: true };
}

export async function createGroupAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const circleId = String(formData.get("circle_id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const leaderName = String(formData.get("leader_name") ?? "").trim();
  const leaderPhone = String(formData.get("leader_phone") ?? "").trim();
  const colorToken = String(formData.get("color_token") ?? "group-1");

  if (!circleId || !name) return { error: "اسم المجموعة مطلوب." };

  const supabase = await createClient();
  const { error } = await supabase.from("groups").insert({
    circle_id: circleId,
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

  if (!id || !name) return { error: "اسم المجموعة مطلوب." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("groups")
    .update({ name, leader_name: leaderName || null, leader_phone: leaderPhone || null })
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
