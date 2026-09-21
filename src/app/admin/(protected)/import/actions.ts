"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

export interface ImportRow {
  code?: string;
  full_name: string;
  guardian_phone: string;
  guardian_name?: string;
  guardian_relation?: string;
  birth_date?: string;
  national_id?: string;
  id_type?: string;
  nationality?: string;
  personal_number?: string;
  address?: string;
  notes?: string;
  circle_name?: string;
  group_name?: string;
}

export interface ImportResult {
  created: number;
  updated: number;
  circlesCreated: number;
  groupsCreated: number;
  errors: { row: number; message: string }[];
}

async function resolveCircleId(
  supabase: SupabaseClient<Database>,
  name: string | undefined,
  seasonId: string | null,
  cache: Map<string, string>,
  counter: { created: number }
): Promise<string | null> {
  const trimmed = name?.trim();
  if (!trimmed) return null;
  const cacheKey = trimmed.toLowerCase();
  if (cache.has(cacheKey)) return cache.get(cacheKey)!;

  let query = supabase.from("circles").select("id").ilike("name", trimmed);
  query = seasonId ? query.eq("season_id", seasonId) : query.is("season_id", null);
  const { data: existing } = await query.maybeSingle();
  if (existing) {
    cache.set(cacheKey, existing.id);
    return existing.id;
  }

  const { data: created, error } = await supabase
    .from("circles")
    .insert({ name: trimmed, season_id: seasonId })
    .select("id")
    .single();
  if (error || !created) return null;
  cache.set(cacheKey, created.id);
  counter.created++;
  return created.id;
}

async function resolveGroupId(
  supabase: SupabaseClient<Database>,
  name: string | undefined,
  circleId: string | null,
  cache: Map<string, string>,
  counter: { created: number }
): Promise<string | null> {
  const trimmed = name?.trim();
  if (!trimmed || !circleId) return null;
  const cacheKey = `${circleId}:${trimmed.toLowerCase()}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey)!;

  const { data: existing } = await supabase
    .from("groups")
    .select("id")
    .eq("circle_id", circleId)
    .ilike("name", trimmed)
    .maybeSingle();
  if (existing) {
    cache.set(cacheKey, existing.id);
    return existing.id;
  }

  const { data: created, error } = await supabase
    .from("groups")
    .insert({ name: trimmed, circle_id: circleId })
    .select("id")
    .single();
  if (error || !created) return null;
  cache.set(cacheKey, created.id);
  counter.created++;
  return created.id;
}

export async function importStudentsAction(
  rows: ImportRow[],
  seasonId: string | null,
  mode: "new" | "update"
): Promise<ImportResult> {
  const supabase = await createClient();
  const result: ImportResult = { created: 0, updated: 0, circlesCreated: 0, groupsCreated: 0, errors: [] };

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const circleCache = new Map<string, string>();
  const groupCache = new Map<string, string>();
  const circleCounter = { created: 0 };
  const groupCounter = { created: 0 };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row.full_name || !row.guardian_phone) {
      result.errors.push({ row: i + 1, message: "الاسم أو جوال ولي الأمر مفقود" });
      continue;
    }

    try {
      const circleId = await resolveCircleId(supabase, row.circle_name, seasonId, circleCache, circleCounter);
      const groupId = await resolveGroupId(supabase, row.group_name, circleId, groupCache, groupCounter);

      const studentFields = {
        full_name: row.full_name,
        guardian_phone: row.guardian_phone,
        guardian_name: row.guardian_name || null,
        guardian_relation: row.guardian_relation || null,
        birth_date: row.birth_date || null,
        national_id: row.national_id || null,
        id_type: (row.id_type as "national_id" | "iqama" | "passport") || "national_id",
        nationality: row.nationality || null,
        personal_number: row.personal_number || null,
        address: row.address || null,
        notes: row.notes || null,
      };

      if (mode === "update") {
        if (!row.code) {
          result.errors.push({ row: i + 1, message: "وضع التحديث يتطلب عمود الكود" });
          continue;
        }
        const { data: existing } = await supabase.from("students").select("id").eq("code", row.code).maybeSingle();
        if (!existing) {
          result.errors.push({ row: i + 1, message: `لا يوجد طالب بالكود ${row.code}` });
          continue;
        }
        const { error } = await supabase.from("students").update(studentFields).eq("id", existing.id);
        if (error) throw error;

        if (seasonId && (circleId || groupId)) {
          const { data: enrollment } = await supabase
            .from("student_season_enrollments")
            .select("id")
            .eq("student_id", existing.id)
            .eq("season_id", seasonId)
            .maybeSingle();
          if (enrollment) {
            await supabase
              .from("student_season_enrollments")
              .update({ circle_id: circleId, group_id: groupId })
              .eq("id", enrollment.id);
          } else {
            await supabase
              .from("student_season_enrollments")
              .insert({ student_id: existing.id, season_id: seasonId, circle_id: circleId, group_id: groupId });
          }
        }
        result.updated++;
        continue;
      }

      // mode === "new": يتجاهل أي كود موجود في الملف ويولّد كوداً جديداً دائماً
      const { data: codeData, error: codeError } = await supabase.rpc("next_student_code");
      if (codeError || !codeData) throw new Error(codeError?.message ?? "تعذّر توليد كود");

      const { data: student, error } = await supabase
        .from("students")
        .insert({ code: codeData, ...studentFields })
        .select("id")
        .single();
      if (error) throw error;

      if (seasonId) {
        await supabase
          .from("student_season_enrollments")
          .insert({ student_id: student.id, season_id: seasonId, circle_id: circleId, group_id: groupId });
      }
      result.created++;
    } catch (err) {
      result.errors.push({ row: i + 1, message: err instanceof Error ? err.message : "خطأ غير معروف" });
    }
  }

  result.circlesCreated = circleCounter.created;
  result.groupsCreated = groupCounter.created;

  await supabase.from("audit_log").insert({
    actor_id: user?.id,
    action: "students.import",
    entity_type: "student",
    metadata: { mode, created: result.created, updated: result.updated, errors: result.errors.length },
  });

  revalidatePath("/admin/students");
  revalidatePath("/admin/circles");
  return result;
}
