import { createClient } from "@/lib/supabase/server";
import { AchievementsPageClient } from "./achievements-page-client";

export default async function AchievementsPage() {
  const supabase = await createClient();

  const [{ data: achievements }, { data: badges }, { data: flags }] = await Promise.all([
    supabase.from("achievements").select("*").order("created_at"),
    supabase.from("badges").select("*").order("created_at"),
    supabase.from("flags").select("*").order("created_at"),
  ]);

  return (
    <AchievementsPageClient
      achievements={achievements ?? []}
      badges={badges ?? []}
      flags={flags ?? []}
    />
  );
}
