import { createClient } from "@/lib/supabase/server";
import { HomeClient } from "./home-client";

interface PublicStats {
  season_name: string | null;
  season_start: string | null;
  season_end: string | null;
  total_active_students: number;
  total_circles: number;
}

export default async function HomePage() {
  const supabase = await createClient();
  const { data } = await supabase.rpc("public_stats");
  const stats = (data as unknown as PublicStats) ?? {
    season_name: null,
    season_start: null,
    season_end: null,
    total_active_students: 0,
    total_circles: 0,
  };

  return <HomeClient stats={stats} />;
}
