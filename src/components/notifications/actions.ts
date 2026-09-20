"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface UnreadParentNote {
  id: string;
  studentId: string;
  studentName: string;
  message: string;
  createdAt: string;
}

export async function getUnreadParentNotesAction(): Promise<UnreadParentNote[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("parent_notes")
    .select("id, student_id, message, created_at, students(full_name)")
    .eq("sender", "parent")
    .eq("is_read_by_admin", false)
    .order("created_at", { ascending: false })
    .limit(30);

  return (data ?? []).map((n) => {
    const student = Array.isArray(n.students) ? n.students[0] : n.students;
    return {
      id: n.id,
      studentId: n.student_id,
      studentName: student?.full_name ?? "—",
      message: n.message,
      createdAt: n.created_at,
    };
  });
}

export async function markNotificationReadAction(noteId: string) {
  const supabase = await createClient();
  await supabase.from("parent_notes").update({ is_read_by_admin: true }).eq("id", noteId);
  revalidatePath("/admin/students");
}
