"use server";

import { createClient } from "@/lib/supabase/server";

export interface GlobalSearchStudent {
  id: string;
  code: string;
  full_name: string;
}

export async function globalSearchStudentsAction(query: string): Promise<GlobalSearchStudent[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("students")
    .select("id, code, full_name")
    .or(`full_name.ilike.%${trimmed}%,code.eq.${trimmed}`)
    .limit(8);
  return data ?? [];
}
