"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createParentToken, PARENT_COOKIE_NAME } from "@/lib/parent-session";
import { lastDigits } from "@/lib/phone";

export type LoginState = { error?: string } | null;

export async function parentLoginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const phone = String(formData.get("phone") ?? "").trim();
  if (!phone) return { error: "الرجاء إدخال رقم الجوال." };

  const admin = createAdminClient();
  const suffix = lastDigits(phone);
  if (suffix.length < 8) return { error: "رقم الجوال غير صالح." };

  const { data: students } = await admin.from("students").select("id, guardian_phone").ilike("guardian_phone", `%${suffix}`);

  if (!students || students.length === 0) {
    return { error: "لا يوجد طالب مسجّل بهذا الرقم. تأكد من الرقم أو تواصل مع إدارة البرنامج." };
  }

  const { token, maxAge } = createParentToken(students[0].guardian_phone);
  const cookieStore = await cookies();
  cookieStore.set(PARENT_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge,
    path: "/",
  });

  redirect("/portal");
}
