import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StudentProfileClient } from "./student-profile-client";

export default async function StudentProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: student } = await supabase.from("students").select("*").eq("id", id).single();
  if (!student) notFound();

  const { data: enrollments } = await supabase
    .from("student_season_enrollments")
    .select("id, season_id, circle_id, group_id, status, total_points, seasons(name, status, start_date), circles(name), groups(name)")
    .eq("student_id", id)
    .order("created_at", { ascending: false });

  const { data: attendanceCounts } = await supabase
    .from("attendance_records")
    .select("season_id, status")
    .eq("student_id", id);

  const attendanceBySeasonStatus: Record<string, Record<string, number>> = {};
  for (const a of attendanceCounts ?? []) {
    attendanceBySeasonStatus[a.season_id] ??= {};
    attendanceBySeasonStatus[a.season_id][a.status] = (attendanceBySeasonStatus[a.season_id][a.status] ?? 0) + 1;
  }

  const { data: achievements } = await supabase
    .from("student_achievements")
    .select("season_id, achievements(name, icon)")
    .eq("student_id", id);

  const { data: badges } = await supabase
    .from("student_badges")
    .select("season_id, badges(name, icon, color_token)")
    .eq("student_id", id);

  const { data: dropoutPeriods } = await supabase
    .from("dropout_periods")
    .select("dropped_at, returned_at, reason")
    .eq("student_id", id)
    .order("dropped_at", { ascending: false });

  const { data: circles } = await supabase.from("circles").select("id, name, groups(id, name)").eq("is_active", true).order("name");
  const { data: currentSeason } = await supabase.from("seasons").select("id, name").eq("status", "current").maybeSingle();

  return (
    <StudentProfileClient
      student={student}
      enrollments={enrollments ?? []}
      attendanceBySeasonStatus={attendanceBySeasonStatus}
      achievements={achievements ?? []}
      badges={badges ?? []}
      dropoutPeriods={dropoutPeriods ?? []}
      circles={circles ?? []}
      currentSeason={currentSeason}
    />
  );
}
