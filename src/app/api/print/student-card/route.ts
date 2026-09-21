import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { renderHtmlToPdf } from "@/lib/pdf/render";
import { buildStudentCardHtml } from "@/lib/print/templates";
import { getScriptFontDataUri, getLogoDataUri, getBarcodeLibSource } from "@/lib/print/fonts";
import { getCardConfig } from "@/lib/print/config";
import { getProgramInfo } from "@/lib/settings";

export async function GET(request: NextRequest) {
  const studentId = request.nextUrl.searchParams.get("studentId");
  if (!studentId) return NextResponse.json({ error: "studentId required" }, { status: 400 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: student } = await supabase
    .from("students")
    .select("full_name, code, birth_date, address")
    .eq("id", studentId)
    .single();
  if (!student) return NextResponse.json({ error: "not found" }, { status: 404 });

  const { data: currentSeason } = await supabase.from("seasons").select("id").eq("status", "current").maybeSingle();
  let circleName: string | null = null;
  let groupName: string | null = null;
  if (currentSeason) {
    const { data: enrollment } = await supabase
      .from("student_season_enrollments")
      .select("circles(name), groups(name)")
      .eq("student_id", studentId)
      .eq("season_id", currentSeason.id)
      .maybeSingle();
    const c = Array.isArray(enrollment?.circles) ? enrollment?.circles[0] : enrollment?.circles;
    const g = Array.isArray(enrollment?.groups) ? enrollment?.groups[0] : enrollment?.groups;
    circleName = c?.name ?? null;
    groupName = g?.name ?? null;
  }

  const programInfo = await getProgramInfo(supabase);
  const config = await getCardConfig(supabase);
  const scriptFont = await getScriptFontDataUri();
  const logo = await getLogoDataUri();
  const barcodeLib = await getBarcodeLibSource();

  const html = buildStudentCardHtml(
    {
      studentName: student.full_name,
      code: student.code,
      programName: programInfo.program_name,
      mosqueName: programInfo.mosque_name,
      circleName,
      groupName,
      secondaryLogoUrl: programInfo.secondary_logo_url || null,
    },
    config,
    scriptFont,
    barcodeLib,
    logo
  );

  const pdf = await renderHtmlToPdf(html, { width: "85mm", height: "54mm" });

  const encodedName = encodeURIComponent(`بطاقة-${student.full_name}.pdf`);
  return new NextResponse(pdf as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="card.pdf"; filename*=UTF-8''${encodedName}`,
    },
  });
}
