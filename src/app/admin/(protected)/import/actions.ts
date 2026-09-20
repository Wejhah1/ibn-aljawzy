"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface ImportRow {
  code?: string;
  full_name: string;
  guardian_phone: string;
  guardian_name?: string;
  guardian_relation?: string;
  birth_date?: string;
  national_id?: string;
  address?: string;
  notes?: string;
}

export interface ImportResult {
  created: number;
  updated: number;
  errors: { row: number; message: string }[];
}

export async function importStudentsAction(rows: ImportRow[], seasonId: string | null): Promise<ImportResult> {
  const supabase = await createClient();
  const result: ImportResult = { created: 0, updated: 0, errors: [] };

  const {
    data: { user },
  } = await supabase.auth.getUser();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row.full_name || !row.guardian_phone) {
      result.errors.push({ row: i + 1, message: "الاسم أو جوال ولي الأمر مفقود" });
      continue;
    }

    try {
      if (row.code) {
        const { data: existing } = await supabase.from("students").select("id").eq("code", row.code).maybeSingle();
        if (existing) {
          const { error } = await supabase
            .from("students")
            .update({
              full_name: row.full_name,
              guardian_phone: row.guardian_phone,
              guardian_name: row.guardian_name || null,
              guardian_relation: row.guardian_relation || null,
              birth_date: row.birth_date || null,
              national_id: row.national_id || null,
              address: row.address || null,
              notes: row.notes || null,
            })
            .eq("id", existing.id);
          if (error) throw error;
          result.updated++;
          continue;
        }
      }

      const { data: codeData, error: codeError } = await supabase.rpc("next_student_code");
      if (codeError || !codeData) throw new Error(codeError?.message ?? "تعذّر توليد كود");

      const { data: student, error } = await supabase
        .from("students")
        .insert({
          code: codeData,
          full_name: row.full_name,
          guardian_phone: row.guardian_phone,
          guardian_name: row.guardian_name || null,
          guardian_relation: row.guardian_relation || null,
          birth_date: row.birth_date || null,
          national_id: row.national_id || null,
          address: row.address || null,
          notes: row.notes || null,
        })
        .select("id")
        .single();
      if (error) throw error;

      if (seasonId) {
        await supabase.from("student_season_enrollments").insert({ student_id: student.id, season_id: seasonId });
      }
      result.created++;
    } catch (err) {
      result.errors.push({ row: i + 1, message: err instanceof Error ? err.message : "خطأ غير معروف" });
    }
  }

  await supabase.from("audit_log").insert({
    actor_id: user?.id,
    action: "students.import",
    entity_type: "student",
    metadata: { created: result.created, updated: result.updated, errors: result.errors.length },
  });

  revalidatePath("/admin/students");
  return result;
}
