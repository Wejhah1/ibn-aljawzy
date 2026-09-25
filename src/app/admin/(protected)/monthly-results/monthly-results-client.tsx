"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import * as XLSX from "xlsx";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import {
  importMonthlyResultsAction,
  togglePublishPeriodAction,
  getStudentsForTemplateAction,
  deletePeriodAction,
  getPeriodResultRowsAction,
  updateResultPercentageAction,
  type MonthlyResultRow,
  type ImportSummary,
  type PeriodResultRow,
} from "./actions";
import { WhatsappExportModal } from "./whatsapp-export-modal";
import { UploadCloud, CheckCircle2, Eye, EyeOff, AlertTriangle, CalendarDays, Pencil, Trash2, MessageCircle, Loader2 } from "lucide-react";
import { LottieLoader } from "@/components/ui/lottie-loader";

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
  programName,
  mosqueName,
}: {
  seasonId: string;
  seasonName: string;
  periods: Period[];
  programName: string;
  mosqueName: string;
}) {
  const [periodLabel, setPeriodLabel] = useState("");
  const [examDate, setExamDate] = useState("");
  const [rows, setRows] = useState<MonthlyResultRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);

  const [editingPeriod, setEditingPeriod] = useState<string | null>(null);
  const [editRows, setEditRows] = useState<PeriodResultRow[]>([]);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [savingRowId, setSavingRowId] = useState<string | null>(null);
  const [deletingPeriod, setDeletingPeriod] = useState<string | null>(null);
  const [whatsappPeriod, setWhatsappPeriod] = useState<string | null>(null);
  const [confirmDeletePeriod, setConfirmDeletePeriod] = useState<string | null>(null);

  const openEdit = async (label: string) => {
    if (editingPeriod === label) {
      setEditingPeriod(null);
      return;
    }
    setEditingPeriod(label);
    setLoadingEdit(true);
    const data = await getPeriodResultRowsAction(seasonId, label);
    setEditRows(data);
    setLoadingEdit(false);
  };

  const saveRow = async (resultId: string, percentage: number | null, statusText: string | null) => {
    setSavingRowId(resultId);
    await updateResultPercentageAction(resultId, percentage, statusText ?? undefined);
    setSavingRowId(null);
  };

  const removePeriod = async (label: string) => {
    setDeletingPeriod(label);
    await deletePeriodAction(seasonId, label);
    setDeletingPeriod(null);
    setConfirmDeletePeriod(null);
    toast.success(`حُذفت نتائج فترة «${label}»`);
    if (editingPeriod === label) setEditingPeriod(null);
  };

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
        const rawVal = String(r["النسبة"] ?? r["النسبة المئوية"] ?? "").trim().replace("%", "").trim();
        // ثلاث حالات: رقم | نص (مثل لم يختبر) | فارغ (يُتجاهل)
        const num = rawVal !== "" && !Number.isNaN(Number(rawVal)) ? Number(rawVal) : null;
        return {
          code: code || undefined,
          name: name || undefined,
          percentage: num,
          statusText: num === null && rawVal !== "" ? rawVal : undefined,
          hasValue: rawVal !== "",
        };
      })
      .filter((r) => (r.code || r.name) && r.hasValue)
      .map((r) => ({ code: r.code, name: r.name, percentage: r.percentage, statusText: r.statusText }));

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
            <Card key={p.label}>
              <div className="flex items-center justify-between flex-wrap gap-(--space-2)">
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
                    title={p.isPublished ? "إخفاء عن أولياء الأمور" : "نشر لأولياء الأمور"}
                  >
                    {p.isPublished ? <EyeOff size={13} /> : <Eye size={13} />}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setWhatsappPeriod(p.label)} title="مشاركة عبر واتساب">
                    <MessageCircle size={13} />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => openEdit(p.label)} title="تعديل النتائج">
                    <Pencil size={13} />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setConfirmDeletePeriod(p.label)}
                    disabled={deletingPeriod === p.label}
                    title="حذف الفترة"
                  >
                    {deletingPeriod === p.label ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} className="text-danger" />}
                  </Button>
                </div>
              </div>

              {editingPeriod === p.label && (
                <div className="mt-(--space-4) pt-(--space-4) border-t border-line">
                  {loadingEdit ? (
                    <div className="flex items-center justify-center py-(--space-4)">
                      <LottieLoader size={64} label="جارِ التحميل..." />
                    </div>
                  ) : (
                    <div className="space-y-(--space-2) max-h-[360px] overflow-y-auto">
                      {editRows.map((r) => (
                        <div key={r.resultId} className="flex items-center justify-between gap-(--space-2)">
                          <div className="min-w-0">
                            <p className="text-sm text-ink truncate">{r.name}</p>
                            <p className="text-xs text-ink-muted">{r.code}</p>
                          </div>
                          <div className="flex items-center gap-(--space-1) shrink-0">
                            <Input
                              value={r.percentage ?? r.statusText ?? ""}
                              onChange={(e) => {
                                const v = e.target.value.trim();
                                const num = v !== "" && !Number.isNaN(Number(v)) ? Number(v) : null;
                                setEditRows((prev) =>
                                  prev.map((row) =>
                                    row.resultId === r.resultId ? { ...row, percentage: num, statusText: num === null ? e.target.value : null } : row
                                  )
                                );
                              }}
                              className="w-28"
                            />
                            <Button
                              size="sm"
                              onClick={() => saveRow(r.resultId, r.percentage, r.statusText)}
                              disabled={savingRowId === r.resultId}
                            >
                              {savingRowId === r.resultId ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {whatsappPeriod && (
        <WhatsappExportModal
          seasonId={seasonId}
          periodLabel={whatsappPeriod}
          programName={programName}
          mosqueName={mosqueName}
          onClose={() => setWhatsappPeriod(null)}
        />
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
            <CardDescription className="mb-(--space-2)">{rows.length} صف جاهز للاستيراد (الخانات الفارغة تُتجاهل).</CardDescription>
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

      {confirmDeletePeriod && (
        <ConfirmDialog
          title="حذف نتائج الفترة"
          message={`هل تريد حذف نتائج فترة «${confirmDeletePeriod}» لجميع الطلاب؟ لا يمكن التراجع عن هذا الإجراء.`}
          confirmLabel="حذف النتائج"
          pending={deletingPeriod === confirmDeletePeriod}
          onConfirm={() => removePeriod(confirmDeletePeriod)}
          onCancel={() => setConfirmDeletePeriod(null)}
        />
      )}
    </main>
  );
}
