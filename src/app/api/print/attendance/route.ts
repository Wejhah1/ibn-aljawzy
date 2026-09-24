import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { renderHtmlToPdf } from "@/lib/pdf/render";
import { getProgramInfo } from "@/lib/settings";

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  present: { label: "حاضر", color: "#0e6b4f" },
  absent: { label: "غائب", color: "#c4362a" },
  late: { label: "متأخر", color: "#9a5b09" },
  excused: { label: "بعذر", color: "#1d5fa8" },
};

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export async function GET(request: NextRequest) {
  const dayId = request.nextUrl.searchParams.get("dayId");
  const circleId = request.nextUrl.searchParams.get("circleId") ?? "none";
  if (!dayId) return NextResponse.json({ error: "dayId required" }, { status: 400 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: day } = await supabase.from("program_days").select("id, day_date, season_id").eq("id", dayId).maybeSingle();
  if (!day) return NextResponse.json({ error: "not found" }, { status: 404 });

  let circleName = "بدون حلقة";
  if (circleId !== "none") {
    const { data: circle } = await supabase.from("circles").select("name").eq("id", circleId).maybeSingle();
    if (!circle) return NextResponse.json({ error: "circle not found" }, { status: 404 });
    circleName = circle.name;
  }

  let enrollQuery = supabase
    .from("student_season_enrollments")
    .select("student_id, groups(name), students(code, full_name, status)")
    .eq("season_id", day.season_id)
    .eq("status", "active");
  enrollQuery = circleId === "none" ? enrollQuery.is("circle_id", null) : enrollQuery.eq("circle_id", circleId);
  const { data: enrollments } = await enrollQuery;

  const { data: records } = await supabase.from("attendance_records").select("student_id, status").eq("program_day_id", dayId);
  const statusByStudent = new Map((records ?? []).map((r) => [r.student_id, r.status as string]));

  const students = (enrollments ?? [])
    .map((e) => {
      const s = Array.isArray(e.students) ? e.students[0] : e.students;
      const g = Array.isArray(e.groups) ? e.groups[0] : e.groups;
      if (!s || s.status !== "active") return null;
      return { id: e.student_id, code: s.code, name: s.full_name, group: g?.name ?? "", status: statusByStudent.get(e.student_id) ?? null };
    })
    .filter((s): s is NonNullable<typeof s> => !!s)
    .sort((a, b) => a.name.localeCompare(b.name, "ar"));

  const programInfo = await getProgramInfo(supabase);
  const dateLabel = new Date(day.day_date).toLocaleDateString("ar-SA", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const counts = { present: 0, absent: 0, late: 0, excused: 0, unmarked: 0 };
  for (const s of students) {
    if (s.status && s.status in counts) counts[s.status as keyof typeof counts]++;
    else counts.unmarked++;
  }

  const rowsHtml = students
    .map((s, i) => {
      const meta = s.status ? STATUS_LABEL[s.status] : null;
      return `<tr>
        <td class="c">${i + 1}</td>
        <td class="c">${esc(s.code)}</td>
        <td>${esc(s.name)}</td>
        <td>${esc(s.group)}</td>
        <td class="c" style="font-weight:700;color:${meta?.color ?? "#5c6862"}">${meta ? meta.label : "لم يُسجّل"}</td>
      </tr>`;
    })
    .join("");

  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl"><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;600;700&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'IBM Plex Sans Arabic', sans-serif; direction: rtl; color: #171b18; font-size: 13px; }
  h1 { font-size: 20px; text-align: center; margin-bottom: 4px; }
  .sub { text-align: center; color: #5c6862; margin-bottom: 10px; }
  .meta { display: flex; justify-content: space-between; margin-bottom: 10px; font-weight: 600; }
  .stats { display: flex; gap: 8px; margin-bottom: 12px; }
  .stats div { flex: 1; border: 1px solid #d5dad7; border-radius: 6px; padding: 6px; text-align: center; font-weight: 700; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #0e6b4f; color: #fff; padding: 7px; font-size: 13px; }
  td { padding: 6px 8px; border-bottom: 1px solid #d5dad7; }
  thead { display: table-header-group; }
  tr { page-break-inside: avoid; }
  tr:nth-child(even) td { background: #f7f7f3; }
  .c { text-align: center; }
</style></head><body>
  <h1>كشف حضور — حلقة ${esc(circleName)}</h1>
  <p class="sub">${esc(programInfo.program_name)} — ${esc(programInfo.mosque_name)}</p>
  <div class="meta"><span>${esc(dateLabel)}</span><span>عدد الطلاب: ${students.length}</span></div>
  <div class="stats">
    <div style="color:#0e6b4f">حاضر: ${counts.present}</div>
    <div style="color:#9a5b09">متأخر: ${counts.late}</div>
    <div style="color:#1d5fa8">بعذر: ${counts.excused}</div>
    <div style="color:#c4362a">غائب: ${counts.absent}</div>
    <div style="color:#5c6862">لم يُسجّل: ${counts.unmarked}</div>
  </div>
  <table>
    <thead><tr><th style="width:40px">#</th><th style="width:70px">الكود</th><th>اسم الطالب</th><th style="width:120px">المجموعة</th><th style="width:90px">الحالة</th></tr></thead>
    <tbody>${rowsHtml}</tbody>
  </table>
</body></html>`;

  const pdf = await renderHtmlToPdf(html, { width: "210mm", height: "297mm", margin: "12mm" });
  const encodedName = encodeURIComponent(`حضور-${circleName}-${day.day_date}.pdf`);
  return new NextResponse(pdf as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="attendance.pdf"; filename*=UTF-8''${encodedName}`,
    },
  });
}
