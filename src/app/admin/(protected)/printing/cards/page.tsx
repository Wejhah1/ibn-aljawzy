import { createClient } from "@/lib/supabase/server";
import { getProgramInfo } from "@/lib/settings";
import { getCardConfig } from "@/lib/print/config";
import { generateBarcodeDataUri } from "@/lib/print/barcode";
import { CardsPrintClient } from "./cards-print-client";

export default async function StudentCardsPrintPage({
  searchParams,
}: {
  searchParams: Promise<{ circle?: string; group?: string }>;
}) {
  const { circle = "", group = "" } = await searchParams;
  const supabase = await createClient();

  const { data: currentSeason } = await supabase.from("seasons").select("id").eq("status", "current").maybeSingle();
  const { data: circles } = await supabase.from("circles").select("id, name").order("name");
  const { data: groups } = await supabase.from("groups").select("id, name").order("name");

  let enrollmentQuery = supabase
    .from("student_season_enrollments")
    .select("circle_id, group_id, students(id, code, full_name, birth_date, address, status), circles(name), groups(name)")
    .eq("status", "active");
  if (currentSeason) enrollmentQuery = enrollmentQuery.eq("season_id", currentSeason.id);
  if (circle) enrollmentQuery = enrollmentQuery.eq("circle_id", circle);
  if (group) enrollmentQuery = enrollmentQuery.eq("group_id", group);

  const { data: enrollments } = currentSeason ? await enrollmentQuery : { data: [] };

  const cardConfig = await getCardConfig(supabase);
  const programInfo = await getProgramInfo(supabase);

  const students = (enrollments ?? [])
    .map((e) => {
      const s = Array.isArray(e.students) ? e.students[0] : e.students;
      const c = Array.isArray(e.circles) ? e.circles[0] : e.circles;
      if (!s || s.status !== "active") return null;
      return {
        id: s.id,
        code: s.code,
        fullName: s.full_name,
        birthDate: s.birth_date,
        address: s.address,
        circleName: c?.name ?? null,
      };
    })
    .filter((s): s is NonNullable<typeof s> => !!s)
    .sort((a, b) => a.fullName.localeCompare(b.fullName, "ar"));

  const barcodes =
    cardConfig.showQrOrBarcode === "barcode"
      ? Object.fromEntries(
          await Promise.all(students.map(async (s) => [s.code, await generateBarcodeDataUri(s.code)] as const))
        )
      : {};

  return (
    <CardsPrintClient
      students={students}
      barcodes={barcodes}
      circles={circles ?? []}
      groups={groups ?? []}
      selectedCircle={circle}
      selectedGroup={group}
      cardConfig={cardConfig}
      programInfo={programInfo}
    />
  );
}
