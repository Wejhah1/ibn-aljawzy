import { createClient } from "@/lib/supabase/server";
import { HomeClient } from "./home-client";

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

export default async function HomePage() {
  const supabase = await createClient();
  const [{ data }, { data: contentData }, { data: news }] = await Promise.all([
    supabase.rpc("public_stats"),
    supabase.rpc("public_homepage_content"),
    supabase
      .from("news_posts")
      .select("id, title, body, image_url, category, published_at")
      .eq("is_published", true)
      .order("published_at", { ascending: false })
      .limit(6),
  ]);

  const stats = (data as unknown as PublicStats) ?? {
    season_name: null,
    season_start: null,
    season_end: null,
    total_active_students: 0,
    total_circles: 0,
  };
  const content = (contentData as unknown as HomepageContent) ?? { hero_title: null, hero_subtitle: null, logo_url: null };

  return <HomeClient stats={stats} content={content} news={news ?? []} />;
}
