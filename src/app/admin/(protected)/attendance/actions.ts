"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function setAttendanceAction(
  studentId: string,
  programDayId: string,
  status: "present" | "absent" | "late" | "excused"
) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("mark_attendance", {
    p_student_id: studentId,
    p_program_day_id: programDayId,
    p_status: status,
  });
  revalidatePath("/admin/attendance");
  revalidatePath("/admin");
  return { error: error?.message };
}

export async function bulkMarkPresentAction(studentIds: string[], programDayId: string) {
  const supabase = await createClient();
  for (const studentId of studentIds) {
    await supabase.rpc("mark_attendance", {
      p_student_id: studentId,
      p_program_day_id: programDayId,
      p_status: "present",
    });
  }
  revalidatePath("/admin/attendance");
  revalidatePath("/admin");
}
