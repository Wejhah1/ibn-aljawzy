"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyParentToken, PARENT_COOKIE_NAME } from "@/lib/parent-session";

export async function parentLogoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(PARENT_COOKIE_NAME);
  redirect("/portal/login");
}

async function assertParentOwnsStudent(studentId: string): Promise<boolean> {
  const cookieStore = await cookies();
  const session = verifyParentToken(cookieStore.get(PARENT_COOKIE_NAME)?.value);
  if (!session) return false;
  const admin = createAdminClient();
  const { data: student } = await admin.from("students").select("guardian_phone").eq("id", studentId).maybeSingle();
  return student?.guardian_phone === session.phone;
}

export async function sendParentNoteAction(studentId: string, message: string) {
  const trimmed = message.trim();
  if (!trimmed) return { error: "الرسالة فارغة" };
  const owns = await assertParentOwnsStudent(studentId);
  if (!owns) return { error: "غير مصرّح" };

  const admin = createAdminClient();
  const { error } = await admin.from("parent_notes").insert({
    student_id: studentId,
    sender: "parent",
    message: trimmed,
    is_read_by_parent: true,
  });
  revalidatePath("/portal");
  return { error: error?.message };
}
