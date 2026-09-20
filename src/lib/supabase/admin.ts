import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

/**
 * عميل service role — يتجاوز RLS بالكامل. لا يُستورد أبداً في كود العميل
 * (Client Component)، فقط داخل Server Actions أو Route Handlers محمية
 * (مثل تسجيل دخول ولي الأمر برقم الجوال).
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
