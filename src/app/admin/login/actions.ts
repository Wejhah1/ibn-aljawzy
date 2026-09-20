"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type AuthState = { error?: string } | null;

function emailFromUsername(username: string) {
  const trimmed = username.trim();
  if (trimmed.includes("@")) return trimmed;
  return `${trimmed}@ibn-aljawzy.local`;
}

export async function loginAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!username || !password) {
    return { error: "الرجاء إدخال اسم المستخدم وكلمة المرور." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: emailFromUsername(username),
    password,
  });

  if (error) {
    return { error: "اسم المستخدم أو كلمة المرور غير صحيحة." };
  }

  revalidatePath("/admin", "layout");
  redirect("/admin");
}

export async function signupAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const fullName = String(formData.get("full_name") ?? "").trim();
  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirm_password") ?? "");

  if (!fullName || !username || !password) {
    return { error: "الرجاء تعبئة جميع الحقول." };
  }
  if (password.length < 8) {
    return { error: "كلمة المرور يجب أن تكون 8 أحرف على الأقل." };
  }
  if (password !== confirmPassword) {
    return { error: "كلمتا المرور غير متطابقتين." };
  }

  const admin = createAdminClient();

  // منع إنشاء حسابات جديدة إلا من قِبل مدير — إلا إذا لم يوجد أي حساب بعد (أول حساب)
  const { count } = await admin.from("profiles").select("id", { count: "exact", head: true });
  const isFirstAccount = (count ?? 0) === 0;

  if (!isFirstAccount) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "يجب تسجيل الدخول كمدير لإنشاء حسابات جديدة." };
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role !== "admin") {
      return { error: "إنشاء الحسابات متاح للمدير فقط. الرجاء التواصل مع إدارة البرنامج." };
    }
  }

  const email = emailFromUsername(username);
  const { error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (error) {
    if (error.message.toLowerCase().includes("already")) {
      return { error: "اسم المستخدم مستخدم بالفعل." };
    }
    return { error: "تعذّر إنشاء الحساب. حاول مرة أخرى." };
  }

  if (isFirstAccount) {
    const supabase = await createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (!signInError) {
      revalidatePath("/admin", "layout");
      redirect("/admin");
    }
  }

  redirect("/admin/login?created=1");
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
