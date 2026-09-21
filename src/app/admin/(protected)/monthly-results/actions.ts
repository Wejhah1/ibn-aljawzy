"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { notifyMonthlyResultsPublished } from "@/app/admin/notifications-actions";

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
  rows: MonthlyResultRow[],
  examDate?: string
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
        { student_id: studentId, season_id: seasonId, period_label: periodLabel, percentage: row.percentage, exam_date: examDate || null },
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
  if (isPublished) {
    notifyMonthlyResultsPublished(seasonId, periodLabel).catch((e) => console.error("فشل إشعار النتائج الشهرية:", e));
  }
}

export async function getStudentsForTemplateAction(seasonId: string): Promise<{ code: string; full_name: string }[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("student_season_enrollments")
    .select("students(code, full_name)")
    .eq("season_id", seasonId)
    .eq("status", "active");

  return (data ?? [])
    .map((r) => (Array.isArray(r.students) ? r.students[0] : r.students))
    .filter((s): s is { code: string; full_name: string } => !!s)
    .sort((a, b) => a.code.localeCompare(b.code));
}

export async function deletePeriodAction(seasonId: string, periodLabel: string) {
  const supabase = await createClient();
  await supabase.from("monthly_results").delete().eq("season_id", seasonId).eq("period_label", periodLabel);
  revalidatePath("/admin/monthly-results");
}

export interface PeriodResultRow {
  resultId: string;
  studentId: string;
  name: string;
  code: string;
  percentage: number;
}

export async function getPeriodResultRowsAction(seasonId: string, periodLabel: string): Promise<PeriodResultRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("monthly_results")
    .select("id, percentage, students(id, full_name, code)")
    .eq("season_id", seasonId)
    .eq("period_label", periodLabel);

  return (data ?? [])
    .map((r) => {
      const s = Array.isArray(r.students) ? r.students[0] : r.students;
      if (!s) return null;
      return { resultId: r.id, studentId: s.id, name: s.full_name, code: s.code, percentage: r.percentage };
    })
    .filter((r): r is PeriodResultRow => !!r)
    .sort((a, b) => a.name.localeCompare(b.name, "ar"));
}

export async function updateResultPercentageAction(resultId: string, percentage: number) {
  const supabase = await createClient();
  await supabase.from("monthly_results").update({ percentage }).eq("id", resultId);
  revalidatePath("/admin/monthly-results");
}

export interface CircleResultsGroup {
  circleName: string;
  students: { name: string; percentage: number }[];
}

export async function getPeriodResultsForExportAction(
  seasonId: string,
  periodLabel: string
): Promise<{ examDate: string | null; groups: CircleResultsGroup[] }> {
  const supabase = await createClient();
  const { data: results } = await supabase
    .from("monthly_results")
    .select("student_id, percentage, exam_date, students(full_name)")
    .eq("season_id", seasonId)
    .eq("period_label", periodLabel);

  const { data: enrollments } = await supabase
    .from("student_season_enrollments")
    .select("student_id, circles(name)")
    .eq("season_id", seasonId);

  const circleByStudent = new Map<string, string>();
  for (const e of enrollments ?? []) {
    const circle = Array.isArray(e.circles) ? e.circles[0] : e.circles;
    if (circle) circleByStudent.set(e.student_id, circle.name);
  }

  const groupMap = new Map<string, { name: string; percentage: number }[]>();
  let examDate: string | null = null;
  for (const r of results ?? []) {
    const s = Array.isArray(r.students) ? r.students[0] : r.students;
    if (!s) continue;
    if (r.exam_date) examDate = r.exam_date;
    const circleName = circleByStudent.get(r.student_id) ?? "بدون حلقة";
    if (!groupMap.has(circleName)) groupMap.set(circleName, []);
    groupMap.get(circleName)!.push({ name: s.full_name, percentage: r.percentage });
  }

  const groups = Array.from(groupMap.entries())
    .map(([circleName, students]) => ({
      circleName,
      students: students.sort((a, b) => b.percentage - a.percentage),
    }))
    .sort((a, b) => a.circleName.localeCompare(b.circleName, "ar"));

  return { examDate, groups };
}
