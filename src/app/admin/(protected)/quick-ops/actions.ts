"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface StudentSearchResult {
  id: string;
  code: string;
  full_name: string;
  guardian_phone: string;
  status: string;
  circle_name: string | null;
}

export async function searchStudentsAction(query: string): Promise<StudentSearchResult[]> {
  const supabase = await createClient();
  const trimmed = query.trim();
  if (!trimmed) return [];

  const { data: currentSeason } = await supabase.from("seasons").select("id").eq("status", "current").maybeSingle();

  const { data } = await supabase
    .from("students")
    .select(
      "id, code, full_name, guardian_phone, status, student_season_enrollments(season_id, circles(name))"
    )
    .or(`full_name.ilike.%${trimmed}%,code.eq.${trimmed},guardian_phone.ilike.%${trimmed}%`)
    .eq("status", "active")
    .limit(15);

  return (data ?? []).map((s) => {
    const enrollment = s.student_season_enrollments.find((e) => e.season_id === currentSeason?.id);
    const circle = Array.isArray(enrollment?.circles) ? enrollment?.circles[0] : enrollment?.circles;
    return {
      id: s.id,
      code: s.code,
      full_name: s.full_name,
      guardian_phone: s.guardian_phone,
      status: s.status,
      circle_name: (circle as { name: string } | null)?.name ?? null,
    };
  });
}

export interface QuickCardData {
  student: {
    id: string;
    code: string;
    full_name: string;
    guardian_phone: string;
    status: string;
  };
  seasonId: string | null;
  seasonName: string | null;
  circleName: string | null;
  groupName: string | null;
  totalPoints: number;
  programDayId: string | null;
  todayStatus: string | null;
}

export async function getStudentQuickCardAction(studentId: string): Promise<QuickCardData | null> {
  const supabase = await createClient();

  const { data: student } = await supabase
    .from("students")
    .select("id, code, full_name, guardian_phone, status")
    .eq("id", studentId)
    .single();
  if (!student) return null;

  const { data: currentSeason } = await supabase.from("seasons").select("id, name").eq("status", "current").maybeSingle();

  let circleName: string | null = null;
  let groupName: string | null = null;
  let totalPoints = 0;

  if (currentSeason) {
    const { data: enrollment } = await supabase
      .from("student_season_enrollments")
      .select("total_points, circles(name), groups(name)")
      .eq("student_id", studentId)
      .eq("season_id", currentSeason.id)
      .maybeSingle();
    if (enrollment) {
      totalPoints = enrollment.total_points;
      circleName = (Array.isArray(enrollment.circles) ? enrollment.circles[0] : enrollment.circles)?.name ?? null;
      groupName = (Array.isArray(enrollment.groups) ? enrollment.groups[0] : enrollment.groups)?.name ?? null;
    }
  }

  let programDayId: string | null = null;
  let todayStatus: string | null = null;

  if (currentSeason) {
    const today = new Date().toISOString().slice(0, 10);
    const { data: programDay } = await supabase
      .from("program_days")
      .select("id")
      .eq("season_id", currentSeason.id)
      .eq("day_date", today)
      .maybeSingle();

    if (programDay) {
      programDayId = programDay.id;
      const { data: attendance } = await supabase
        .from("attendance_records")
        .select("status")
        .eq("student_id", studentId)
        .eq("program_day_id", programDay.id)
        .maybeSingle();
      todayStatus = attendance?.status ?? null;
    }
  }

  return {
    student,
    seasonId: currentSeason?.id ?? null,
    seasonName: currentSeason?.name ?? null,
    circleName,
    groupName,
    totalPoints,
    programDayId,
    todayStatus,
  };
}

export async function quickMarkAttendanceAction(
  studentId: string,
  programDayId: string,
  status: "present" | "absent" | "late" | "excused"
) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("mark_attendance", {
    p_student_id: studentId,
    p_program_day_id: programDayId,
    p_status: status,
  });
  revalidatePath("/admin/quick-ops");
  revalidatePath("/admin");
  return { error: error?.message };
}

export async function quickAddPointsAction(studentId: string, seasonId: string, points: number, reason?: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("add_manual_points", {
    p_student_id: studentId,
    p_season_id: seasonId,
    p_points: points,
    p_reason: reason,
  });
  revalidatePath("/admin/quick-ops");
  return { error: error?.message };
}
