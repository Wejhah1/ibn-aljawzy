import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

export interface ProgramInfo {
  program_name: string;
  mosque_name: string;
  address: string;
  contact_phone: string;
  secondary_logo_url: string;
}

const DEFAULTS: ProgramInfo = {
  program_name: "حلقات ابن الجوزي",
  mosque_name: "مسجد الطرباق",
  address: "",
  contact_phone: "",
  secondary_logo_url: "",
};

export async function getProgramInfo(supabase: SupabaseClient<Database>): Promise<ProgramInfo> {
  const { data } = await supabase.from("app_settings").select("key, value").eq("category", "program_info");
  const info = { ...DEFAULTS };
  for (const row of data ?? []) {
    if (row.key in info) {
      (info as unknown as Record<string, unknown>)[row.key] = row.value;
    }
  }
  return info;
}
