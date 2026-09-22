import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StudentProfileClient } from "./student-profile-client";

export default async function StudentProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: student } = await supabase.from("students").select("*").eq("id", id).single();
  if (!student) notFound();

  const [
    { data: enrollments },
    { data: attendanceCounts },
    { data: achievements },
    { data: badges },
    { data: dropoutPeriods },
    { data: circles },
    { data: groups },
    { data: currentSeason },
    { data: parentNotes },
    { data: allAchievements },
    { data: allBadges },
    { data: allFlags },
    { data: studentFlags },
    { data: pointTransactions },
  ] = await Promise.all([
    supabase
      .from("student_season_enrollments")
      .select("id, season_id, circle_id, group_id, status, total_points, seasons(name, status, start_date), circles(name), groups(name)")
      .eq("student_id", id)
      .order("created_at", { ascending: false }),
    supabase.from("attendance_records").select("season_id, status").eq("student_id", id),
    supabase.from("student_achievements").select("season_id, achievements(name, icon)").eq("student_id", id),
    supabase.from("student_badges").select("season_id, badges(name, icon, color_token)").eq("student_id", id),
    supabase.from("dropout_periods").select("dropped_at, returned_at, reason").eq("student_id", id).order("dropped_at", { ascending: false }),
    supabase.from("circles").select("id, name").eq("is_active", true).order("name"),
    supabase.from("groups").select("id, name").order("name"),
    supabase.from("seasons").select("id, name").eq("status", "current").maybeSingle(),
    supabase.from("parent_notes").select("id, sender, message, created_at, is_read_by_admin").eq("student_id", id).order("created_at", { ascending: true }),
    supabase.from("achievements").select("id, name, points_awarded").eq("is_active", true).order("name"),
    supabase.from("badges").select("id, name").eq("is_active", true).order("name"),
    supabase.from("flags").select("id, name, severity").eq("is_active", true).order("name"),
    supabase
      .from("student_flags")
      .select("id, flag_id, is_resolved, note, set_at, flags(name, severity)")
      .eq("student_id", id)
      .order("set_at", { ascending: false }),
    supabase
      .from("point_transactions")
      .select("id, points, source, reason, created_at, season_id, profiles(full_name)")
      .eq("student_id", id)
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  const attendanceBySeasonStatus: Record<string, Record<string, number>> = {};
  for (const a of attendanceCounts ?? []) {
    attendanceBySeasonStatus[a.season_id] ??= {};
    attendanceBySeasonStatus[a.season_id][a.status] = (attendanceBySeasonStatus[a.season_id][a.status] ?? 0) + 1;
  }

  if (parentNotes?.some((n) => n.sender === "parent" && !n.is_read_by_admin)) {
    await supabase.from("parent_notes").update({ is_read_by_admin: true }).eq("student_id", id).eq("sender", "parent");
  }

  return (
    <StudentProfileClient
      student={student}
      enrollments={enrollments ?? []}
      attendanceBySeasonStatus={attendanceBySeasonStatus}
      achievements={achievements ?? []}
      badges={badges ?? []}
      dropoutPeriods={dropoutPeriods ?? []}
      circles={circles ?? []}
      groups={groups ?? []}
      currentSeason={currentSeason}
      allAchievements={allAchievements ?? []}
      allBadges={allBadges ?? []}
      allFlags={allFlags ?? []}
      studentFlags={studentFlags ?? []}
      parentNotes={parentNotes ?? []}
      pointTransactions={pointTransactions ?? []}
    />
  );
}
