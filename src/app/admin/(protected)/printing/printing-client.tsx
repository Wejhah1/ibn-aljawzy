"use client";

import { useMemo, useState, useTransition } from "react";
import { Card, CardTitle } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { buildCertificateHtml, buildStudentCardHtml } from "@/lib/print/templates";
import type { CertificateConfig, StudentCardConfig } from "@/lib/print/types";
import type { ProgramInfo } from "@/lib/settings";
import { saveCertificateConfigAction, saveCardConfigAction, searchStudentsForPrintAction } from "./actions";
import { Save, Download, Search, Award, IdCard } from "lucide-react";

const SCRIPT_FONT_PREVIEW_SRC = "/fonts/TheYearOfHandicrafts-Regular.otf";

export function PrintingClient({
  initialCertificateConfig,
  initialCardConfig,
  programInfo,
  seasonName,
}: {
  initialCertificateConfig: CertificateConfig;
  initialCardConfig: StudentCardConfig;
  programInfo: ProgramInfo;
  seasonName: string;
}) {
  const [tab, setTab] = useState<"certificate" | "card">("certificate");

  return (
    <main className="p-(--space-4) md:p-(--space-8) max-w-[1200px] mx-auto">
      <h1 className="text-[22px] leading-[30px] font-bold text-ink mb-(--space-6)">الطباعة والشهادات</h1>

      <div className="flex items-center gap-(--space-2) mb-(--space-6)">
        <button
          onClick={() => setTab("certificate")}
          className={`h-11 px-(--space-4) rounded-(--radius-sm) border-bold text-sm font-bold flex items-center gap-2 ${
            tab === "certificate" ? "bg-brand text-on-brand border-line-strong shadow-brutal-sm" : "bg-surface-raised text-ink-muted border-line-strong"
          }`}
        >
          <Award size={15} /> مصمم الشهادة
        </button>
        <button
          onClick={() => setTab("card")}
          className={`h-11 px-(--space-4) rounded-(--radius-sm) border-bold text-sm font-bold flex items-center gap-2 ${
            tab === "card" ? "bg-brand text-on-brand border-line-strong shadow-brutal-sm" : "bg-surface-raised text-ink-muted border-line-strong"
          }`}
        >
          <IdCard size={15} /> مصمم بطاقة الطالب
        </button>
      </div>

      {tab === "certificate" ? (
        <CertificateDesigner initial={initialCertificateConfig} programInfo={programInfo} seasonName={seasonName} />
      ) : (
        <CardDesigner initial={initialCardConfig} programInfo={programInfo} />
      )}
    </main>
  );
}

function StudentPicker({ onPick }: { onPick: (s: { id: string; full_name: string; code: string }) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ id: string; full_name: string; code: string }[]>([]);

  return (
    <div className="relative">
      <div className="relative">
        <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint" />
        <Input
          value={query}
          onChange={async (e) => {
            setQuery(e.target.value);
            setResults(await searchStudentsForPrintAction(e.target.value));
          }}
          placeholder="اختر طالباً للاختبار..."
          className="pr-9"
        />
      </div>
      {results.length > 0 && (
        <div className="absolute z-10 mt-1 w-full rounded-(--radius-sm) border border-line bg-surface-raised shadow-md max-h-[200px] overflow-y-auto">
          {results.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                onPick(s);
                setResults([]);
                setQuery(s.full_name);
              }}
              className="w-full text-right px-(--space-3) py-(--space-2) text-sm hover:bg-surface-sunken"
            >
              {s.full_name} <span className="text-ink-faint">#{s.code}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function CertificateDesigner({
  initial,
  programInfo,
  seasonName,
}: {
  initial: CertificateConfig;
  programInfo: ProgramInfo;
  seasonName: string;
}) {
  const [config, setConfig] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [student, setStudent] = useState<{ id: string; full_name: string; code: string } | null>(null);

  const html = useMemo(
    () =>
      buildCertificateHtml(
        {
          studentName: student?.full_name ?? "اسم الطالب",
          programName: programInfo.program_name,
          mosqueName: programInfo.mosque_name,
          seasonName,
          achievementLabel: "لتفوقه وإتقانه",
          dateLabel: new Date().toLocaleDateString("ar-SA"),
        },
        config,
        SCRIPT_FONT_PREVIEW_SRC
      ),
    [config, programInfo, seasonName, student]
  );

  return (
    <div className="grid lg:grid-cols-[380px_1fr] gap-(--space-6)">
      <Card className="space-y-(--space-4) h-fit">
        <div>
          <Label htmlFor="titleText">عنوان الشهادة</Label>
          <Input id="titleText" value={config.titleText} onChange={(e) => setConfig({ ...config, titleText: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="bodyText">النص (استخدم {"{program}"} و{"{mosque}"})</Label>
          <Textarea id="bodyText" rows={3} value={config.bodyText} onChange={(e) => setConfig({ ...config, bodyText: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-(--space-3)">
          <div>
            <Label htmlFor="signatureLabel">التوقيع الأول</Label>
            <Input id="signatureLabel" value={config.signatureLabel} onChange={(e) => setConfig({ ...config, signatureLabel: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="secondSignatureLabel">التوقيع الثاني</Label>
            <Input
              id="secondSignatureLabel"
              value={config.secondSignatureLabel}
              onChange={(e) => setConfig({ ...config, secondSignatureLabel: e.target.value })}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="orientation">اتجاه الورقة</Label>
          <select
            id="orientation"
            value={config.orientation}
            onChange={(e) => setConfig({ ...config, orientation: e.target.value as "portrait" | "landscape" })}
            className="h-11 w-full rounded-(--radius-sm) border border-line bg-surface-raised px-(--space-3) text-sm text-ink"
          >
            <option value="landscape">أفقي</option>
            <option value="portrait">عمودي</option>
          </select>
        </div>
        <label className="flex items-center gap-(--space-2) text-sm font-semibold text-ink">
          <input type="checkbox" checked={config.showLogo} onChange={(e) => setConfig({ ...config, showLogo: e.target.checked })} className="h-5 w-5" />
          إظهار الشعار
        </label>
        <label className="flex items-center gap-(--space-2) text-sm font-semibold text-ink">
          <input
            type="checkbox"
            checked={config.showSignatureLine}
            onChange={(e) => setConfig({ ...config, showSignatureLine: e.target.checked })}
            className="h-5 w-5"
          />
          إظهار خطوط التوقيع
        </label>

        <div className="pt-(--space-3) border-t border-line space-y-(--space-3)">
          <StudentPicker onPick={setStudent} />
          <div className="flex gap-(--space-2)">
            <Button
              size="sm"
              variant="secondary"
              className="flex-1"
              onClick={() =>
                startTransition(async () => {
                  await saveCertificateConfigAction(config);
                  setSaved(true);
                  setTimeout(() => setSaved(false), 1500);
                })
              }
              disabled={pending}
            >
              <Save size={14} /> {saved ? "تم الحفظ" : "حفظ التصميم"}
            </Button>
            {student && (
              <a href={`/api/print/certificate?studentId=${student.id}`} target="_blank" rel="noreferrer">
                <Button size="sm" variant="outline">
                  <Download size={14} /> PDF تجريبي
                </Button>
              </a>
            )}
          </div>
        </div>
      </Card>

      <Card className="flex items-center justify-center p-(--space-4) bg-surface-sunken overflow-auto">
        <div style={{ transform: "scale(0.55)", transformOrigin: "center" }}>
          <iframe title="معاينة الشهادة" srcDoc={html} style={{ width: "297mm", height: "210mm", border: "none" }} />
        </div>
      </Card>
    </div>
  );
}

function CardDesigner({ initial, programInfo }: { initial: StudentCardConfig; programInfo: ProgramInfo }) {
  const [config, setConfig] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [student, setStudent] = useState<{ id: string; full_name: string; code: string } | null>(null);

  const html = useMemo(
    () =>
      buildStudentCardHtml(
        {
          studentName: student?.full_name ?? "اسم الطالب",
          code: student?.code ?? "000",
          programName: programInfo.program_name,
          mosqueName: programInfo.mosque_name,
          circleName: "حلقة تجريبية",
          birthDate: "2014-01-01",
          address: null,
        },
        config,
        SCRIPT_FONT_PREVIEW_SRC,
        config.showQrOrBarcode === "barcode" ? `/api/print/barcode?code=${student?.code ?? "000"}` : null
      ),
    [config, programInfo, student]
  );

  return (
    <div className="grid lg:grid-cols-[380px_1fr] gap-(--space-6)">
      <Card className="space-y-(--space-4) h-fit">
        <div>
          <Label htmlFor="showQrOrBarcode">رمز التعريف</Label>
          <select
            id="showQrOrBarcode"
            value={config.showQrOrBarcode}
            onChange={(e) => setConfig({ ...config, showQrOrBarcode: e.target.value as "barcode" | "qr" | "none" })}
            className="h-11 w-full rounded-(--radius-sm) border border-line bg-surface-raised px-(--space-3) text-sm text-ink"
          >
            <option value="barcode">باركود</option>
            <option value="none">بدون</option>
          </select>
        </div>
        <label className="flex items-center gap-(--space-2) text-sm font-semibold text-ink">
          <input
            type="checkbox"
            checked={config.showBirthDate}
            onChange={(e) => setConfig({ ...config, showBirthDate: e.target.checked })}
            className="h-5 w-5"
          />
          إظهار تاريخ الميلاد
        </label>
        <label className="flex items-center gap-(--space-2) text-sm font-semibold text-ink">
          <input
            type="checkbox"
            checked={config.showAddress}
            onChange={(e) => setConfig({ ...config, showAddress: e.target.checked })}
            className="h-5 w-5"
          />
          إظهار العنوان
        </label>

        <div className="pt-(--space-3) border-t border-line space-y-(--space-3)">
          <StudentPicker onPick={setStudent} />
          <div className="flex gap-(--space-2)">
            <Button
              size="sm"
              variant="secondary"
              className="flex-1"
              onClick={() =>
                startTransition(async () => {
                  await saveCardConfigAction(config);
                  setSaved(true);
                  setTimeout(() => setSaved(false), 1500);
                })
              }
              disabled={pending}
            >
              <Save size={14} /> {saved ? "تم الحفظ" : "حفظ التصميم"}
            </Button>
            {student && (
              <a href={`/api/print/student-card?studentId=${student.id}`} target="_blank" rel="noreferrer">
                <Button size="sm" variant="outline">
                  <Download size={14} /> PDF تجريبي
                </Button>
              </a>
            )}
          </div>
        </div>
      </Card>

      <Card className="flex items-center justify-center p-(--space-4) bg-surface-sunken">
        <div style={{ transform: "scale(2.2)", transformOrigin: "center" }}>
          <iframe title="معاينة البطاقة" srcDoc={html} style={{ width: "85.6mm", height: "54mm", border: "none" }} />
        </div>
      </Card>
    </div>
  );
}
