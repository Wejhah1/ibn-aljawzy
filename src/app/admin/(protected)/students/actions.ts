"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type FormState = { error?: string; success?: boolean } | null;

function normalizePhone(phone: string) {
  return phone.trim().replace(/[^\d+]/g, "");
}

export async function createStudentAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const fullName = String(formData.get("full_name") ?? "").trim();
  const guardianPhone = normalizePhone(String(formData.get("guardian_phone") ?? ""));
  const guardianName = String(formData.get("guardian_name") ?? "").trim();
  const guardianRelation = String(formData.get("guardian_relation") ?? "").trim();
  const birthDate = String(formData.get("birth_date") ?? "");
  const nationalId = String(formData.get("national_id") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const circleId = String(formData.get("circle_id") ?? "");
  const groupId = String(formData.get("group_id") ?? "");
  const seasonId = String(formData.get("season_id") ?? "");

  if (!fullName || !guardianPhone) {
    return { error: "الاسم الكامل وجوال ولي الأمر مطلوبان." };
  }

  const supabase = await createClient();
  const { data: codeData, error: codeError } = await supabase.rpc("next_student_code");
  if (codeError || !codeData) {
    return { error: "تعذّر توليد كود الطالب: " + (codeError?.message ?? "") };
  }

  const { data: student, error } = await supabase
    .from("students")
    .insert({
      code: codeData,
      full_name: fullName,
      guardian_phone: guardianPhone,
      guardian_name: guardianName || null,
      guardian_relation: guardianRelation || null,
      birth_date: birthDate || null,
      national_id: nationalId || null,
      address: address || null,
      notes: notes || null,
    })
    .select("id")
    .single();

  if (error) return { error: "تعذّر إنشاء الطالب: " + error.message };

  if (seasonId) {
    await supabase.from("student_season_enrollments").insert({
      student_id: student.id,
      season_id: seasonId,
      circle_id: circleId || null,
      group_id: groupId || null,
    });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  await supabase.from("audit_log").insert({
    actor_id: user?.id,
    action: "student.create",
    entity_type: "student",
    entity_id: student.id,
    metadata: { full_name: fullName, code: codeData },
  });

  revalidatePath("/admin/students");
  redirect(`/admin/students/${student.id}`);
}

export async function updateStudentAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const id = String(formData.get("id") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();
  const guardianPhone = normalizePhone(String(formData.get("guardian_phone") ?? ""));
  const guardianName = String(formData.get("guardian_name") ?? "").trim();
  const guardianRelation = String(formData.get("guardian_relation") ?? "").trim();
  const birthDate = String(formData.get("birth_date") ?? "");
  const nationalId = String(formData.get("national_id") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!id || !fullName || !guardianPhone) {
    return { error: "الاسم الكامل وجوال ولي الأمر مطلوبان." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("students")
    .update({
      full_name: fullName,
      guardian_phone: guardianPhone,
      guardian_name: guardianName || null,
      guardian_relation: guardianRelation || null,
      birth_date: birthDate || null,
      national_id: nationalId || null,
      address: address || null,
      notes: notes || null,
    })
    .eq("id", id);

  if (error) return { error: "تعذّر تحديث بيانات الطالب: " + error.message };

  revalidatePath(`/admin/students/${id}`);
  revalidatePath("/admin/students");
  return { success: true };
}

export async function updateEnrollmentAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const enrollmentId = String(formData.get("enrollment_id") ?? "");
  const studentId = String(formData.get("student_id") ?? "");
  const seasonId = String(formData.get("season_id") ?? "");
  const circleId = String(formData.get("circle_id") ?? "");
  const groupId = String(formData.get("group_id") ?? "");

  const supabase = await createClient();

  if (enrollmentId) {
    const { error } = await supabase
      .from("student_season_enrollments")
      .update({ circle_id: circleId || null, group_id: groupId || null })
      .eq("id", enrollmentId);
    if (error) return { error: "تعذّر تحديث التسجيل: " + error.message };
  } else if (seasonId) {
    const { error } = await supabase.from("student_season_enrollments").insert({
      student_id: studentId,
      season_id: seasonId,
      circle_id: circleId || null,
      group_id: groupId || null,
    });
    if (error) return { error: "تعذّر تسجيل الطالب في الموسم: " + error.message };
  }

  revalidatePath(`/admin/students/${studentId}`);
  return { success: true };
}

export async function dropoutStudentAction(studentId: string, reason: string) {
  const supabase = await createClient();
  await supabase.rpc("mark_student_dropped_out", { p_student_id: studentId, p_reason: reason });
  revalidatePath(`/admin/students/${studentId}`);
  revalidatePath("/admin/students");
}

export async function returnStudentAction(studentId: string) {
  const supabase = await createClient();
  await supabase.rpc("mark_student_returned", { p_student_id: studentId });
  revalidatePath(`/admin/students/${studentId}`);
  revalidatePath("/admin/students");
}
