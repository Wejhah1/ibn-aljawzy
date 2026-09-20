"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import {
  importMonthlyResultsAction,
  togglePublishPeriodAction,
  getStudentsForTemplateAction,
  type MonthlyResultRow,
  type ImportSummary,
} from "./actions";
import { UploadCloud, CheckCircle2, Eye, EyeOff, AlertTriangle, CalendarDays } from "lucide-react";

interface Period {
  label: string;
  count: number;
  avg: number;
  isPublished: boolean;
  examDate: string | null;
}

export function MonthlyResultsClient({
  seasonId,
  seasonName,
  periods,
}: {
  seasonId: string;
  seasonName: string;
  periods: Period[];
}) {
  const [periodLabel, setPeriodLabel] = useState("");
  const [examDate, setExamDate] = useState("");
  const [rows, setRows] = useState<MonthlyResultRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);

  const handleFile = async (file: File) => {
    setFileName(file.name);
    setSummary(null);
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const raw: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    const parsed: MonthlyResultRow[] = raw
      .map((r) => {
        const code = String(r["كود"] ?? r["الكود"] ?? "").trim();
        const name = String(r["الاسم"] ?? r["اسم الطالب"] ?? "").trim();
        const percentage = Number(r["النسبة"] ?? r["النسبة المئوية"] ?? 0);
        return { code: code || undefined, name: name || undefined, percentage };
      })
      .filter((r) => (r.code || r.name) && !Number.isNaN(r.percentage));

    setRows(parsed);
  };

  const runImport = async () => {
    if (!periodLabel.trim() || rows.length === 0) return;
    setImporting(true);
    const res = await importMonthlyResultsAction(seasonId, periodLabel.trim(), rows, examDate || undefined);
    setSummary(res);
    setImporting(false);
  };

  const downloadTemplate = async () => {
    setDownloadingTemplate(true);
    const students = await getStudentsForTemplateAction(seasonId);
    const wsData = [
      ["كود", "الاسم", "النسبة"],
      ...(students.length > 0 ? students.map((s) => [s.code, s.full_name, ""]) : [["000", "أحمد محمد السيد", 92]]),
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "النتائج");
    XLSX.writeFile(wb, "قالب_النتائج_الشهرية.xlsx");
    setDownloadingTemplate(false);
  };

  return (
    <main className="p-(--space-4) md:p-(--space-8) max-w-[800px] mx-auto">
      <h1 className="text-[22px] leading-[30px] font-bold text-ink mb-(--space-2)">النتائج الشهرية</h1>
      <p className="text-sm text-ink-muted mb-(--space-6)">{seasonName}</p>

      {periods.length > 0 && (
        <div className="mb-(--space-6) space-y-(--space-2)">
          {periods.map((p) => (
            <Card key={p.label} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-ink">{p.label}</p>
                <p className="text-[12px] text-ink-muted">
                  {p.count} طالب · متوسط {p.avg}%
                  {p.examDate && (
                    <span className="inline-flex items-center gap-1 mr-2">
                      <CalendarDays size={11} /> {new Date(p.examDate).toLocaleDateString("ar-SA")}
                    </span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-(--space-2)">
                {p.isPublished ? <Badge tone="success">منشور لأولياء الأمور</Badge> : <Badge tone="neutral">غير منشور</Badge>}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => togglePublishPeriodAction(seasonId, p.label, !p.isPublished)}
                >
                  {p.isPublished ? <EyeOff size={13} /> : <Eye size={13} />}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <div className="flex items-center justify-between mb-(--space-4)">
          <CardTitle>رفع نتائج فترة جديدة</CardTitle>
          <Button size="sm" variant="outline" onClick={downloadTemplate} disabled={downloadingTemplate}>
            {downloadingTemplate ? "جارِ التحضير..." : "تحميل قالب"}
          </Button>
        </div>
        <div className="grid sm:grid-cols-2 gap-(--space-3) mb-(--space-4)">
          <div>
            <Label htmlFor="periodLabel">اسم الفترة</Label>
            <Input id="periodLabel" value={periodLabel} onChange={(e) => setPeriodLabel(e.target.value)} placeholder="مثال: الشهر الأول" />
          </div>
          <div>
            <Label htmlFor="examDate">تاريخ الاختبار (اختياري)</Label>
            <Input id="examDate" type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} />
          </div>
        </div>
        <label className="flex flex-col items-center justify-center gap-(--space-2) rounded-(--radius-md) border-bold border-dashed border-line-strong bg-surface-sunken h-28 cursor-pointer hover:bg-brand-soft transition-colors">
          <UploadCloud size={22} className="text-ink-muted" />
          <span className="text-sm font-semibold text-ink-muted">{fileName || "اختر ملف Excel"}</span>
          <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
        </label>

        {rows.length > 0 && (
          <div className="mt-(--space-4)">
            <CardDescription className="mb-(--space-2)">{rows.length} صف جاهز للاستيراد.</CardDescription>
            <Button onClick={runImport} disabled={importing || !periodLabel.trim()}>
              {importing ? "جارِ الحفظ..." : "حفظ النتائج"}
            </Button>
          </div>
        )}

        {summary && (
          <div className="mt-(--space-4) pt-(--space-4) border-t border-line">
            <p className="text-sm font-semibold text-brand flex items-center gap-2">
              <CheckCircle2 size={16} /> تم حفظ {summary.saved} نتيجة.
            </p>
            {summary.notFound.length > 0 && (
              <div className="mt-(--space-2) space-y-1">
                {summary.notFound.map((n, i) => (
                  <p key={i} className="text-[12px] text-warning flex items-center gap-1">
                    <AlertTriangle size={11} /> صف {n.row}: لم يُعثر على الطالب &quot;{n.label}&quot;
                  </p>
                ))}
              </div>
            )}
          </div>
        )}
      </Card>
    </main>
  );
}
