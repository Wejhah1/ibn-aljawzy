"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/types";
import type { CertificateConfig, StudentCardConfig } from "@/lib/print/types";

export async function saveCertificateConfigAction(config: CertificateConfig) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  await supabase
    .from("app_settings")
    .upsert(
      { category: "printing", key: "certificate_config", value: config as unknown as Json, updated_by: user?.id },
      { onConflict: "category,key" }
    );
  revalidatePath("/admin/printing");
}

export async function saveCardConfigAction(config: StudentCardConfig) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  await supabase
    .from("app_settings")
    .upsert(
      { category: "printing", key: "card_config", value: config as unknown as Json, updated_by: user?.id },
      { onConflict: "category,key" }
    );
  revalidatePath("/admin/printing");
}

export async function searchStudentsForPrintAction(query: string) {
  const supabase = await createClient();
  if (!query.trim()) return [];
  const { data } = await supabase
    .from("students")
    .select("id, full_name, code")
    .or(`full_name.ilike.%${query}%,code.eq.${query}`)
    .limit(10);
  return data ?? [];
}
