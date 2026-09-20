"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/types";

export type FormState = { error?: string; success?: boolean } | null;

export async function saveHomepageContentAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const fields = ["hero_title", "hero_subtitle", "logo_url"] as const;
  for (const key of fields) {
    const value = String(formData.get(key) ?? "");
    await supabase
      .from("app_settings")
      .upsert(
        { category: "homepage", key, value: value as unknown as Json, updated_by: user?.id },
        { onConflict: "category,key" }
      );
  }
  revalidatePath("/admin/content");
  revalidatePath("/");
  return { success: true };
}

export async function createNewsPostAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const imageUrl = String(formData.get("image_url") ?? "").trim();
  if (!title) return { error: "عنوان الخبر مطلوب." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("news_posts")
    .insert({ title, body: body || null, image_url: imageUrl || null, created_by: user?.id });
  if (error) return { error: error.message };

  revalidatePath("/admin/content");
  revalidatePath("/");
  return { success: true };
}

export async function toggleNewsPublishedAction(id: string, isPublished: boolean) {
  const supabase = await createClient();
  await supabase.from("news_posts").update({ is_published: isPublished }).eq("id", id);
  revalidatePath("/admin/content");
  revalidatePath("/");
}

export async function deleteNewsPostAction(id: string) {
  const supabase = await createClient();
  await supabase.from("news_posts").delete().eq("id", id);
  revalidatePath("/admin/content");
  revalidatePath("/");
}
