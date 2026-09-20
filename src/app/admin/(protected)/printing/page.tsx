import { createClient } from "@/lib/supabase/server";
import { getCertificateConfig, getCardConfig } from "@/lib/print/config";
import { getProgramInfo } from "@/lib/settings";
import { PrintingClient } from "./printing-client";

export default async function PrintingPage() {
  const supabase = await createClient();
  const certificateConfig = await getCertificateConfig(supabase);
  const cardConfig = await getCardConfig(supabase);
  const programInfo = await getProgramInfo(supabase);
  const { data: currentSeason } = await supabase.from("seasons").select("name").eq("status", "current").maybeSingle();

  return (
    <PrintingClient
      initialCertificateConfig={certificateConfig}
      initialCardConfig={cardConfig}
      programInfo={programInfo}
      seasonName={currentSeason?.name ?? "الموسم الحالي"}
    />
  );
}
