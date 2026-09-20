"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface MonthlyResultRow {
  code?: string;
  name?: string;
  percentage: number;
}

export interface ImportSummary {
  saved: number;
  notFound: { row: number; label: string }[];
}

export async function importMonthlyResultsAction(
  seasonId: string,
  periodLabel: string,
  rows: MonthlyResultRow[]
): Promise<ImportSummary> {
  const supabase = await createClient();
  const summary: ImportSummary = { saved: 0, notFound: [] };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    let studentId: string | null = null;

    if (row.code) {
      const { data } = await supabase.from("students").select("id").eq("code", row.code).maybeSingle();
      studentId = data?.id ?? null;
    }
    if (!studentId && row.name) {
      const { data } = await supabase.from("students").select("id").ilike("full_name", row.name).limit(1);
      studentId = data?.[0]?.id ?? null;
    }

    if (!studentId) {
      summary.notFound.push({ row: i + 1, label: row.code ?? row.name ?? "—" });
      continue;
    }

    const { error } = await supabase
      .from("monthly_results")
      .upsert(
        { student_id: studentId, season_id: seasonId, period_label: periodLabel, percentage: row.percentage },
        { onConflict: "student_id,season_id,period_label" }
      );
    if (!error) summary.saved++;
  }

  revalidatePath("/admin/monthly-results");
  return summary;
}

export async function togglePublishPeriodAction(seasonId: string, periodLabel: string, isPublished: boolean) {
  const supabase = await createClient();
  await supabase
    .from("monthly_results")
    .update({ is_published: isPublished })
    .eq("season_id", seasonId)
    .eq("period_label", periodLabel);
  revalidatePath("/admin/monthly-results");
}
