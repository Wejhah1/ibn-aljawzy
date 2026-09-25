import { createClient } from "@/lib/supabase/server";
import { HomeClient, type SeasonProgress, type TopStudent } from "./home-client";

interface PublicStats {
  season_name: string | null;
  season_start: string | null;
  season_end: string | null;
  total_active_students: number;
  total_circles: number;
}

interface HomepageContent {
  hero_title: string | null;
  hero_subtitle: string | null;
  logo_url: string | null;
}

interface PublicLeaderboardStudents {
  students: { id: string; full_name: string; circle_name: string | null; points: number }[];
}

const DAY_MS = 86400000;

function seasonProgress(start: string | null, end: string | null): SeasonProgress | null {
  if (!start || !end) return null;
  const now = Date.now();
  const s = new Date(`${start}T00:00:00+03:00`).getTime();
  const e = new Date(`${end}T23:59:59+03:00`).getTime();
  if (Number.isNaN(s) || Number.isNaN(e) || e <= s) return null;
  const totalDays = Math.max(1, Math.round((e - s) / DAY_MS));
  const elapsed = Math.min(totalDays, Math.max(0, Math.ceil((now - s) / DAY_MS)));
  return { totalDays, elapsedDays: elapsed, started: now >= s, ended: now > e };
}

export default async function HomePage() {
  const supabase = await createClient();
  const [{ data }, { data: contentData }, { data: news }, { data: leaderboard }] = await Promise.all([
    supabase.rpc("public_stats"),
    supabase.rpc("public_homepage_content"),
    supabase
      .from("news_posts")
      .select("id, title, body, image_url, category, published_at")
      .eq("is_published", true)
      .order("published_at", { ascending: false })
      .limit(6),
    supabase.rpc("public_leaderboard"),
  ]);

  const stats = (data as unknown as PublicStats) ?? {
    season_name: null,
    season_start: null,
    season_end: null,
    total_active_students: 0,
    total_circles: 0,
  };
  const content = (contentData as unknown as HomepageContent) ?? { hero_title: null, hero_subtitle: null, logo_url: null };

  const topStudents: TopStudent[] = [...((leaderboard as unknown as PublicLeaderboardStudents | null)?.students ?? [])]
    .sort((a, b) => b.points - a.points)
    .slice(0, 3)
    .filter((s) => s.points > 0)
    .map((s) => ({ id: s.id, fullName: s.full_name, circleName: s.circle_name, points: s.points }));

  return (
    <HomeClient
      stats={stats}
      content={content}
      news={news ?? []}
      topStudents={topStudents}
      progress={seasonProgress(stats.season_start, stats.season_end)}
    />
  );
}
