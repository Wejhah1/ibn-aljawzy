import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getProgramInfo } from "@/lib/settings";
import { verifyParentToken, PARENT_COOKIE_NAME } from "@/lib/parent-session";
import { PublicLeaderboardClient } from "./public-leaderboard-client";

interface PublicLeaderboardResult {
  season_name: string | null;
  students: {
    id: string;
    full_name: string;
    code: string;
    circle_name: string | null;
    points: number;
    attendance_rate: number;
    achievements_count: number;
    badges: { name: string; icon: string | null }[];
  }[];
  groups: { id: string; name: string; color_token: string; total_points: number }[];
  circles: { id: string; name: string; color_token: string; total_points: number }[];
}

// إن كان الزائر ولي أمر مسجّل الدخول، نعرف أبناءه لنبرز ترتيبهم في اللوحة
async function getParentStudentIds(): Promise<string[]> {
  const cookieStore = await cookies();
  const session = verifyParentToken(cookieStore.get(PARENT_COOKIE_NAME)?.value);
  if (!session) return [];
  const admin = createAdminClient();
  const { data } = await admin.from("students").select("id").eq("guardian_phone", session.phone);
  return (data ?? []).map((s) => s.id);
}

export default async function PublicLeaderboardPage({ searchParams }: PageProps<"/leaderboard">) {
  const { tv } = await searchParams;
  const supabase = await createClient();
  const [{ data }, programInfo, myStudentIds] = await Promise.all([
    supabase.rpc("public_leaderboard"),
    getProgramInfo(supabase),
    getParentStudentIds(),
  ]);
  const result = (data ?? { season_name: null, students: [], groups: [], circles: [] }) as unknown as PublicLeaderboardResult;

  const entries = result.students.map((s) => ({
    studentId: s.id,
    fullName: s.full_name,
    circleName: s.circle_name,
    points: s.points,
    attendanceRate: s.attendance_rate,
    achievementsCount: s.achievements_count,
    badges: s.badges ?? [],
  }));
  const groupEntries = result.groups.map((g) => ({ id: g.id, name: g.name, colorToken: g.color_token, points: g.total_points }));
  const circleEntries = result.circles.map((c) => ({ id: c.id, name: c.name, colorToken: c.color_token, points: c.total_points }));

  return (
    <PublicLeaderboardClient
      seasonName={result.season_name}
      entries={entries}
      groupEntries={groupEntries}
      circleEntries={circleEntries}
      programInfo={programInfo}
      tvMode={tv === "1"}
      myStudentIds={myStudentIds}
    />
  );
}
