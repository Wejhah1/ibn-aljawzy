"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/types";

export type FormState = { error?: string; success?: boolean } | null;

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, supabase };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  return { ok: profile?.role === "admin", supabase, userId: user.id };
}

// ---------- معلومات البرنامج ----------
export async function saveProgramInfoAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const fields = ["program_name", "mosque_name", "address", "contact_phone"] as const;
  for (const key of fields) {
    const value = String(formData.get(key) ?? "");
    await supabase
      .from("app_settings")
      .upsert(
        { category: "program_info", key, value: value as unknown as Json, updated_by: user?.id },
        { onConflict: "category,key" }
      );
  }
  revalidatePath("/admin/settings");
  return { success: true };
}

// ---------- قوالب واتساب ----------
export async function saveWhatsappTemplateAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const context = String(formData.get("context") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  if (!context || !body) return { error: "النص مطلوب." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("whatsapp_templates")
    .update({ body, updated_by: user?.id })
    .eq("context", context as "attendance_absent" | "attendance_late" | "students_list_contact" | "quick_ops_contact");

  if (error) return { error: error.message };
  revalidatePath("/admin/settings");
  return { success: true };
}

export async function saveWhatsappApiConfigAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isEnabled = formData.get("is_enabled") === "on";
  await supabase
    .from("app_settings")
    .upsert(
      { category: "whatsapp", key: "cloud_api_enabled", value: isEnabled as unknown as Json, updated_by: user?.id },
      { onConflict: "category,key" }
    );
  revalidatePath("/admin/settings");
  return { success: true };
}

// ---------- المستخدمون ----------
export async function inviteUserAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const { ok } = await requireAdmin();
  if (!ok) return { error: "هذا الإجراء متاح للمدير فقط." };

  const fullName = String(formData.get("full_name") ?? "").trim();
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "data_entry") as "admin" | "supervisor" | "data_entry";

  if (!fullName || !username || password.length < 8) {
    return { error: "الرجاء تعبئة جميع الحقول (كلمة مرور 8 أحرف على الأقل)." };
  }

  const admin = createAdminClient();
  const email = username.includes("@") ? username : `${username}@ibn-aljawzy.local`;

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (error) return { error: "تعذّر إنشاء الحساب: " + error.message };

  if (role !== "data_entry") {
    await admin.from("profiles").update({ role }).eq("id", data.user!.id);
  }

  revalidatePath("/admin/settings");
  return { success: true };
}

export async function updateUserRoleAction(userId: string, role: "admin" | "supervisor" | "data_entry") {
  const { ok, supabase } = await requireAdmin();
  if (!ok) return;
  await supabase.from("profiles").update({ role }).eq("id", userId);
  revalidatePath("/admin/settings");
}

export async function toggleUserActiveAction(userId: string, isActive: boolean) {
  const { ok, supabase } = await requireAdmin();
  if (!ok) return;
  await supabase.from("profiles").update({ is_active: isActive }).eq("id", userId);
  revalidatePath("/admin/settings");
}

// ---------- الحساب والأمان ----------
export async function changePasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirm_password") ?? "");

  if (password.length < 8) return { error: "كلمة المرور يجب أن تكون 8 أحرف على الأقل." };
  if (password !== confirmPassword) return { error: "كلمتا المرور غير متطابقتين." };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };
  return { success: true };
}
