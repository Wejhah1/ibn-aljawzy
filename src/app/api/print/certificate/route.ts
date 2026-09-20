import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { renderHtmlToPdf } from "@/lib/pdf/render";
import { buildCertificateHtml } from "@/lib/print/templates";
import { getScriptFontDataUri, getLogoDataUri } from "@/lib/print/fonts";
import { getCertificateConfig } from "@/lib/print/config";
import { getProgramInfo } from "@/lib/settings";

export async function GET(request: NextRequest) {
  const studentId = request.nextUrl.searchParams.get("studentId");
  const achievementLabel = request.nextUrl.searchParams.get("achievementLabel") ?? "لتفوقه وإتقانه";
  if (!studentId) return NextResponse.json({ error: "studentId required" }, { status: 400 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: student } = await supabase.from("students").select("full_name").eq("id", studentId).single();
  if (!student) return NextResponse.json({ error: "not found" }, { status: 404 });

  const { data: currentSeason } = await supabase.from("seasons").select("name").eq("status", "current").maybeSingle();
  const programInfo = await getProgramInfo(supabase);
  const config = await getCertificateConfig(supabase);
  const scriptFont = await getScriptFontDataUri();
  const logo = await getLogoDataUri();

  const html = buildCertificateHtml(
    {
      studentName: student.full_name,
      programName: programInfo.program_name,
      mosqueName: programInfo.mosque_name,
      seasonName: currentSeason?.name ?? "",
      achievementLabel,
      dateLabel: new Date().toLocaleDateString("ar-SA"),
    },
    config,
    scriptFont,
    logo
  );

  const pdf = await renderHtmlToPdf(html, {
    width: config.orientation === "landscape" ? "297mm" : "210mm",
    height: config.orientation === "landscape" ? "210mm" : "297mm",
  });

  const encodedName = encodeURIComponent(`شهادة-${student.full_name}.pdf`);
  return new NextResponse(pdf as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="certificate.pdf"; filename*=UTF-8''${encodedName}`,
    },
  });
}
