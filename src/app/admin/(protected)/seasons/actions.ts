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
  const carryCircles = formData.get("carry_circles") === "on";
  const carryGroups = formData.get("carry_groups") === "on";

  if (!name || !startDate || !endDate) {
    return { error: "الرجاء تعبئة اسم الموسم وفترته." };
  }
  if (new Date(endDate) <= new Date(startDate)) {
    return { error: "تاريخ النهاية يجب أن يكون بعد تاريخ البداية." };
  }

  const supabase = await createClient();
  const { data: newSeasonId, error } = await supabase.rpc("create_season", {
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

  if (newSeasonId) {
    const carryError = await carryStructureToSeason(supabase, newSeasonId, carryCircles, carryGroups);
    if (carryError) return { error: "أُنشئ الموسم لكن تعذّر ترحيل الحلقات/المجموعات: " + carryError };
  }

  revalidatePath("/admin/seasons");
  revalidatePath("/admin/circles");
  revalidatePath("/admin/students");
  revalidatePath("/admin");
  return { success: true };
}

/**
 * create_season ينسخ حلقة/مجموعة الطالب من الموسم السابق كما هي (تشير لحلقات الموسم القديم).
 * هنا: إن طُلب ترحيل الحلقات/المجموعات ننشئ نسخاً جديدة لها في الموسم الجديد ونربط الطلاب بها،
 * وإن لم يُطلب نفك الارتباط.
 */
async function carryStructureToSeason(
  supabase: Awaited<ReturnType<typeof createClient>>,
  seasonId: string,
  carryCircles: boolean,
  carryGroups: boolean
): Promise<string | null> {
  const { data: enrollments, error: enrollError } = await supabase
    .from("student_season_enrollments")
    .select("id, circle_id, group_id")
    .eq("season_id", seasonId);
  if (enrollError) return enrollError.message;
  if (!enrollments?.length) return null;

  const circleMap = new Map<string, string>();
  const groupMap = new Map<string, string>();

  if (carryCircles) {
    const oldIds = [...new Set(enrollments.map((e) => e.circle_id).filter((x): x is string => !!x))];
    if (oldIds.length) {
      const { data: oldCircles, error } = await supabase.from("circles").select("*").in("id", oldIds);
      if (error) return error.message;
      for (const c of oldCircles ?? []) {
        const { data: created, error: insErr } = await supabase
          .from("circles")
          .insert({
            name: c.name,
            color_token: c.color_token,
            leader_name: c.leader_name,
            leader_phone: c.leader_phone,
            teacher_name: c.teacher_name,
            teacher_phone: c.teacher_phone,
            is_active: c.is_active,
            season_id: seasonId,
          })
          .select("id")
          .single();
        if (insErr || !created) return insErr?.message ?? "insert circle failed";
        circleMap.set(c.id, created.id);
      }
    }
  }

  if (carryGroups) {
    const oldIds = [...new Set(enrollments.map((e) => e.group_id).filter((x): x is string => !!x))];
    if (oldIds.length) {
      const { data: oldGroups, error } = await supabase.from("groups").select("*").in("id", oldIds);
      if (error) return error.message;
      for (const g of oldGroups ?? []) {
        const { data: created, error: insErr } = await supabase
          .from("groups")
          .insert({
            name: g.name,
            color_token: g.color_token,
            leader_name: g.leader_name,
            leader_phone: g.leader_phone,
            circle_id: g.circle_id ? circleMap.get(g.circle_id) ?? null : null,
          })
          .select("id")
          .single();
        if (insErr || !created) return insErr?.message ?? "insert group failed";
        groupMap.set(g.id, created.id);
      }
    }
  }

  for (const e of enrollments) {
    const newCircle = e.circle_id ? circleMap.get(e.circle_id) ?? null : null;
    const newGroup = e.group_id ? groupMap.get(e.group_id) ?? null : null;
    const { error } = await supabase
      .from("student_season_enrollments")
      .update({ circle_id: newCircle, group_id: newGroup })
      .eq("id", e.id);
    if (error) return error.message;
  }
  return null;
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

export interface ProgramDay {
  id: string;
  day_date: string;
  is_holiday: boolean;
  note: string | null;
}

export async function getProgramDaysAction(seasonId: string): Promise<ProgramDay[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("program_days")
    .select("id, day_date, is_holiday, note")
    .eq("season_id", seasonId)
    .order("day_date");
  return data ?? [];
}

export async function toggleHolidayAction(dayId: string, isHoliday: boolean, note?: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("program_days")
    .update({ is_holiday: isHoliday, note: isHoliday ? note || null : null })
    .eq("id", dayId);
  revalidatePath("/admin/seasons");
  revalidatePath("/admin/attendance");
  revalidatePath("/admin/reports");
  return { error: error?.message };
}

export async function markHolidayRangeAction(
  seasonId: string,
  startDate: string,
  endDate: string,
  note: string
): Promise<{ error?: string; count?: number }> {
  if (!startDate || !endDate || endDate < startDate) return { error: "فترة غير صالحة." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("program_days")
    .update({ is_holiday: true, note: note || null })
    .eq("season_id", seasonId)
    .gte("day_date", startDate)
    .lte("day_date", endDate)
    .select("id");

  if (error) return { error: error.message };

  revalidatePath("/admin/seasons");
  revalidatePath("/admin/attendance");
  revalidatePath("/admin/reports");
  return { count: data?.length ?? 0 };
}

export async function deleteSeasonPermanentlyAction(seasonId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("delete_season_permanently", { p_season_id: seasonId });
  revalidatePath("/admin/seasons");
  revalidatePath("/admin");
  return { error: error?.message };
}
