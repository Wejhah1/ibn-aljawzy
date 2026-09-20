import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import {
  DEFAULT_CERTIFICATE_CONFIG,
  DEFAULT_CARD_CONFIG,
  type CertificateConfig,
  type StudentCardConfig,
} from "@/lib/print/types";

export async function getCertificateConfig(supabase: SupabaseClient<Database>): Promise<CertificateConfig> {
  const { data } = await supabase
    .from("app_settings")
    .select("value")
    .eq("category", "printing")
    .eq("key", "certificate_config")
    .maybeSingle();
  return data ? { ...DEFAULT_CERTIFICATE_CONFIG, ...(data.value as object) } : DEFAULT_CERTIFICATE_CONFIG;
}

export async function getCardConfig(supabase: SupabaseClient<Database>): Promise<StudentCardConfig> {
  const { data } = await supabase
    .from("app_settings")
    .select("value")
    .eq("category", "printing")
    .eq("key", "card_config")
    .maybeSingle();
  return data ? { ...DEFAULT_CARD_CONFIG, ...(data.value as object) } : DEFAULT_CARD_CONFIG;
}
