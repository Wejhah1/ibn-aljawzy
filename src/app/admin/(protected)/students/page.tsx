import { createClient } from "@/lib/supabase/server";
import { getProgramInfo } from "@/lib/settings";
import { DEFAULT_WHATSAPP_TEMPLATES } from "@/lib/whatsapp";
import { StudentsListClient } from "./students-list-client";

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; circle?: string }>;
}) {
  const { q = "", status = "active", circle = "" } = await searchParams;
  const supabase = await createClient();

  const { data: currentSeason } = await supabase
    .from("seasons")
    .select("id")
    .eq("status", "current")
    .maybeSingle();

  const { data: circles } = await supabase.from("circles").select("id, name").order("name");

  let query = supabase
    .from("students")
    .select(
      "id, code, full_name, guardian_name, guardian_phone, status, student_season_enrollments(season_id, circle_id, circles(name), groups(name))"
    )
    .order("full_name");

  if (status !== "all") query = query.eq("status", status as "active" | "dropped_out");
  if (q) query = query.or(`full_name.ilike.%${q}%,code.eq.${q},guardian_phone.ilike.%${q}%`);

  const { data: students } = await query;

  const filtered = (students ?? []).filter((s) => {
    if (!circle) return true;
    return s.student_season_enrollments.some(
      (e) => e.season_id === currentSeason?.id && e.circle_id === circle
    );
  });

  const { data: unreadNotes } = await supabase
    .from("parent_notes")
    .select("student_id")
    .eq("sender", "parent")
    .eq("is_read_by_admin", false);
  const unreadStudentIds = new Set((unreadNotes ?? []).map((n) => n.student_id));

  const programInfo = await getProgramInfo(supabase);
  const { data: templateRow } = await supabase
    .from("whatsapp_templates")
    .select("body")
    .eq("context", "students_list_contact")
    .maybeSingle();
  const template = templateRow?.body ?? DEFAULT_WHATSAPP_TEMPLATES.students_list_contact;

  const rows = filtered.map((s) => {
    const enrollment = s.student_season_enrollments.find((e) => e.season_id === currentSeason?.id);
    const circleName = Array.isArray(enrollment?.circles) ? enrollment?.circles[0]?.name : (enrollment?.circles as { name: string } | null)?.name;
    const groupName = Array.isArray(enrollment?.groups) ? enrollment?.groups[0]?.name : (enrollment?.groups as { name: string } | null)?.name;
    return {
      id: s.id,
      code: s.code,
      fullName: s.full_name,
      guardianName: s.guardian_name,
      guardianPhone: s.guardian_phone,
      status: s.status,
      circleName: circleName ?? null,
      groupName: groupName ?? null,
      hasUnreadNote: unreadStudentIds.has(s.id),
    };
  });

  return (
    <StudentsListClient
      rows={rows}
      circles={circles ?? []}
      q={q}
      status={status}
      circle={circle}
      programInfo={programInfo}
      template={template}
    />
  );
}
