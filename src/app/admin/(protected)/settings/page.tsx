import { createClient } from "@/lib/supabase/server";
import { getProgramInfo } from "@/lib/settings";
import { SettingsClient } from "./settings-client";

export default async function SettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: myProfile } = await supabase.from("profiles").select("role, full_name").eq("id", user!.id).single();

  const programInfo = await getProgramInfo(supabase);
  const { data: templates } = await supabase.from("whatsapp_templates").select("*").order("context");
  const { data: whatsappSettings } = await supabase
    .from("app_settings")
    .select("key, value")
    .eq("category", "whatsapp");
  const cloudApiEnabled = Boolean(whatsappSettings?.find((s) => s.key === "cloud_api_enabled")?.value);

  const { data: profiles } = await supabase.from("profiles").select("*").order("created_at");

  const { data: auditLog } = await supabase
    .from("audit_log")
    .select("id, action, entity_type, entity_id, created_at, metadata, profiles(full_name)")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <SettingsClient
      myRole={myProfile?.role ?? "data_entry"}
      programInfo={programInfo}
      templates={templates ?? []}
      cloudApiEnabled={cloudApiEnabled}
      profiles={profiles ?? []}
      auditLog={auditLog ?? []}
      currentUserId={user!.id}
    />
  );
}
