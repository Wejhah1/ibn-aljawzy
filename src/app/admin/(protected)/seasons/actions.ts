"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type SeasonActionState = { error?: string; success?: boolean } | null;

export async function createSeasonAction(
  _prev: SeasonActionState,
  formData: FormData
): Promise<SeasonActionState> {
  const name = String(formData.get("name") ?? "").trim();
  const startDate = String(formData.get("start_date") ?? "");
  const endDate = String(formData.get("end_date") ?? "");
  const weeklyOffDays = formData.getAll("weekly_off_days").map((v) => Number(v));
  const carryOverPoints = formData.get("carry_over_points") === "on";
  const setAsCurrent = formData.get("set_as_current") === "on";

  if (!name || !startDate || !endDate) {
    return { error: "الرجاء تعبئة اسم الموسم وفترته." };
  }
  if (new Date(endDate) <= new Date(startDate)) {
    return { error: "تاريخ النهاية يجب أن يكون بعد تاريخ البداية." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_season", {
    p_name: name,
    p_start_date: startDate,
    p_end_date: endDate,
    p_weekly_off_days: weeklyOffDays,
    p_carry_over_points: carryOverPoints,
    p_set_as_current: setAsCurrent,
  });

  if (error) {
    return { error: "تعذّر إنشاء الموسم: " + error.message };
  }

  revalidatePath("/admin/seasons");
  revalidatePath("/admin");
  return { success: true };
}

export async function setCurrentSeasonAction(seasonId: string) {
  const supabase = await createClient();
  await supabase.rpc("set_current_season", { p_season_id: seasonId });
  revalidatePath("/admin/seasons");
  revalidatePath("/admin");
}

export async function archiveSeasonAction(seasonId: string) {
  const supabase = await createClient();
  await supabase.rpc("archive_season", { p_season_id: seasonId });
  revalidatePath("/admin/seasons");
  revalidatePath("/admin");
}

export async function deleteSeasonPermanentlyAction(seasonId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("delete_season_permanently", { p_season_id: seasonId });
  revalidatePath("/admin/seasons");
  revalidatePath("/admin");
  return { error: error?.message };
}
