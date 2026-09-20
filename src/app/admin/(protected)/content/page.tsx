import { createClient } from "@/lib/supabase/server";
import { ContentClient } from "./content-client";

export default async function ContentPage() {
  const supabase = await createClient();

  const { data: homepageSettings } = await supabase.from("app_settings").select("key, value").eq("category", "homepage");
  const homepage = {
    hero_title: "",
    hero_subtitle: "",
    logo_url: "",
    ...Object.fromEntries((homepageSettings ?? []).map((s) => [s.key, s.value as string])),
  };

  const { data: news } = await supabase.from("news_posts").select("*").order("published_at", { ascending: false });

  return <ContentClient homepage={homepage} news={news ?? []} />;
}
