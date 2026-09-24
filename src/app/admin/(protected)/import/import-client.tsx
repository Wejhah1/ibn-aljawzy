"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { importStudentsAction, getStudentsForUpdateTemplateAction, type ImportRow, type ImportResult } from "./actions";
import { UploadCloud, FileSpreadsheet, CheckCircle2, AlertTriangle, Download, UserPlus, RefreshCw } from "lucide-react";

type Mode = "new" | "update";

const COLUMN_MAP: Record<string, keyof ImportRow> = {
  "كود": "code",
  "الكود": "code",
  "الاسم": "full_name",
  "الاسم الكامل": "full_name",
  "اسم الطالب": "full_name",
  "جوال ولي الأمر": "guardian_phone",
  "رقم جوال ولي الأمر": "guardian_phone",
  "اسم ولي الأمر": "guardian_name",
  "صلة القرابة": "guardian_relation",
  "تاريخ الميلاد": "birth_date",
  "رقم الهوية": "national_id",
  "نوع الهوية": "id_type",
  "الجنسية": "nationality",
  "الرقم الشخصي": "personal_number",
  "العنوان": "address",
  "ملاحظات": "notes",
  "الحلقة": "circle_name",
  "المجموعة": "group_name",
};

const ID_TYPE_MAP: Record<string, string> = {
  "هوية": "national_id",
  "هوية وطنية": "national_id",
  "اقامة": "iqama",
  "إقامة": "iqama",
  "جواز": "passport",
  "جواز سفر": "passport",
};

function excelDateToIso(value: unknown): string | undefined {
  if (!value) return undefined;
  if (typeof value === "number") {
    const date = XLSX.SSF.parse_date_code(value);
    if (!date) return undefined;
    return `${date.y}-${String(date.m).padStart(2, "0")}-${String(date.d).padStart(2, "0")}`;
  }
  return String(value).trim() || undefined;
}

export function ImportClient({ currentSeason }: { currentSeason: { id: string; name: string } | null }) {
  const [mode, setMode] = useState<Mode>("new");
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const switchMode = (m: Mode) => {
    setMode(m);
    setRows([]);
    setFileName("");
    setResult(null);
  };

  const handleFile = async (file: File) => {
    setFileName(file.name);
    setResult(null);
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const raw: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    const parsed: ImportRow[] = raw
      .map((r) => {
        const row: Partial<ImportRow> = {};
        for (const [header, value] of Object.entries(r)) {
          const key = COLUMN_MAP[header.trim()];
          if (!key) continue;
          if (key === "birth_date") {
            row[key] = excelDateToIso(value);
          } else if (key === "id_type") {
            const raw = String(value ?? "").trim();
            row.id_type = ID_TYPE_MAP[raw] ?? (raw ? "national_id" : undefined);
          } else {
            const str = String(value ?? "").trim();
            if (str) (row as Record<string, string>)[key] = str;
          }
        }
        if (mode === "new") delete row.code;
        return row as ImportRow;
      })
      .filter((r) => r.full_name || r.guardian_phone);

    setRows(parsed);
  };

  const runImport = async () => {
    setImporting(true);
    const res = await importStudentsAction(rows, currentSeason?.id ?? null, mode);
    setResult(res);
    setImporting(false);
  };

  const downloadTemplate = async () => {
    const header = [
      ...(mode === "update" ? ["كود"] : []),
      "الاسم",
      "جوال ولي الأمر",
      "اسم ولي الأمر",
      "صلة القرابة",
      "تاريخ الميلاد",
      "نوع الهوية",
      "رقم الهوية",
      "الجنسية",
      "الرقم الشخصي",
      "الحلقة",
      "المجموعة",
      "العنوان",
      "ملاحظات",
    ];
    const existing = mode === "update" ? await getStudentsForUpdateTemplateAction(currentSeason?.id ?? null) : [];
    const dataRows =
      mode === "update"
        ? existing.map((s) => [
            s.code, s.full_name, s.guardian_phone, s.guardian_name, s.guardian_relation, s.birth_date,
            s.id_type, s.national_id, s.nationality, s.personal_number, s.circle_name, s.group_name, s.address, s.notes,
          ])
        : [];
    const ws = XLSX.utils.aoa_to_sheet([header, ...dataRows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "الطلاب");
    XLSX.writeFile(wb, mode === "new" ? "قالب_استيراد_طلاب_جدد.xlsx" : "قالب_تحديث_طلاب.xlsx");
  };

  return (
    <div className="space-y-(--space-6)">
      <div className="flex items-center gap-(--space-2)">
        <button
          onClick={() => switchMode("new")}
          className={`flex-1 h-14 rounded-(--radius-sm) border-bold text-sm font-bold flex items-center justify-center gap-2 ${
            mode === "new" ? "bg-brand text-on-brand border-line-strong shadow-brutal-sm" : "bg-surface-raised text-ink-muted border-line-strong"
          }`}
        >
          <UserPlus size={16} /> استيراد طلاب جدد
        </button>
        <button
          onClick={() => switchMode("update")}
          className={`flex-1 h-14 rounded-(--radius-sm) border-bold text-sm font-bold flex items-center justify-center gap-2 ${
            mode === "update" ? "bg-brand text-on-brand border-line-strong shadow-brutal-sm" : "bg-surface-raised text-ink-muted border-line-strong"
          }`}
        >
          <RefreshCw size={16} /> تحديث طلاب حاليين
        </button>
      </div>

      <Card className={mode === "new" ? "border-brand" : "border-info"}>
        <CardDescription>
          {mode === "new"
            ? "استيراد بدون كود — سيُنشئ الموقع كوداً جديداً لكل طالب تلقائياً. أي عمود \"كود\" في الملف يُتجاهل."
            : "استيراد بكود — يجب أن يحتوي الملف على عمود \"كود\" مطابق لكود الطالب الحالي في الموقع، وسيتم تحديث بياناته."}
          {" "}إن وضعت اسم حلقة أو مجموعة غير موجودة سيتم إنشاؤها تلقائياً وربط الطالب بها.
        </CardDescription>
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-(--space-4)">
          <CardTitle>1. رفع الملف</CardTitle>
          <Button size="sm" variant="outline" onClick={downloadTemplate}>
            <Download size={14} /> {mode === "update" ? "تحميل قالب بيانات الطلاب" : "تحميل قالب فارغ"}
          </Button>
        </div>
        <label className="flex flex-col items-center justify-center gap-(--space-2) rounded-(--radius-md) border-bold border-dashed border-line-strong bg-surface-sunken h-32 cursor-pointer hover:bg-brand-soft transition-colors">
          <UploadCloud size={24} className="text-ink-muted" />
          <span className="text-sm font-semibold text-ink-muted">
            {fileName || "اضغط لاختيار ملف Excel (.xlsx)"}
          </span>
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
        </label>
      </Card>

      {rows.length > 0 && (
        <Card>
          <div className="flex items-center gap-(--space-2) mb-(--space-4)">
            <FileSpreadsheet size={18} className="text-brand" />
            <CardTitle>2. معاينة ({rows.length} صف)</CardTitle>
          </div>
          <div className="overflow-x-auto rounded-(--radius-sm) border border-line">
            <table className="w-full text-[13px]">
              <thead className="bg-surface-sunken">
                <tr>
                  {mode === "update" && <th className="p-(--space-2) text-right font-semibold">كود</th>}
                  <th className="p-(--space-2) text-right font-semibold">الاسم</th>
                  <th className="p-(--space-2) text-right font-semibold">جوال ولي الأمر</th>
                  <th className="p-(--space-2) text-right font-semibold">الحلقة</th>
                  <th className="p-(--space-2) text-right font-semibold">المجموعة</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 50).map((r, i) => (
                  <tr key={i} className="border-t border-line">
                    {mode === "update" && (
                      <td className="p-(--space-2)">{r.code || <Badge tone="danger">بلا كود</Badge>}</td>
                    )}
                    <td className="p-(--space-2) font-semibold">{r.full_name}</td>
                    <td className="p-(--space-2)" dir="ltr">
                      {r.guardian_phone}
                    </td>
                    <td className="p-(--space-2)">{r.circle_name || "—"}</td>
                    <td className="p-(--space-2)">{r.group_name || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {rows.length > 50 && (
            <CardDescription className="mt-(--space-2)">
              يُعرض أول 50 صف فقط للمعاينة، سيتم استيراد جميع الصفوف الـ {rows.length}.
            </CardDescription>
          )}
          {currentSeason && mode === "new" && (
            <CardDescription className="mt-(--space-2)">
              سيتم تسجيل الطلاب الجدد تلقائياً في الموسم الحالي: {currentSeason.name}
            </CardDescription>
          )}
          <div className="flex justify-end mt-(--space-4)">
            <Button onClick={runImport} disabled={importing}>
              {importing ? "جارِ الاستيراد..." : mode === "new" ? `استيراد ${rows.length} طالب جديد` : `تحديث ${rows.length} طالب`}
            </Button>
          </div>
        </Card>
      )}

      {result && (
        <Card className={result.errors.length > 0 ? "border-warning" : "border-brand"}>
          <div className="flex items-center gap-(--space-2) mb-(--space-3)">
            <CheckCircle2 size={18} className="text-brand" />
            <CardTitle>نتيجة الاستيراد</CardTitle>
          </div>
          <div className="flex items-center gap-(--space-2) flex-wrap mb-(--space-3)">
            <Badge tone="success">{result.created} طالب جديد</Badge>
            <Badge tone="info">{result.updated} تحديث</Badge>
            {result.circlesCreated > 0 && <Badge tone="brand">{result.circlesCreated} حلقة أُنشئت</Badge>}
            {result.groupsCreated > 0 && <Badge tone="brand">{result.groupsCreated} مجموعة أُنشئت</Badge>}
            {result.errors.length > 0 && <Badge tone="danger">{result.errors.length} خطأ</Badge>}
          </div>
          {result.errors.length > 0 && (
            <div className="space-y-1 mt-(--space-3) pt-(--space-3) border-t border-line">
              {result.errors.map((e, i) => (
                <p key={i} className="text-[12px] text-danger flex items-center gap-1">
                  <AlertTriangle size={11} /> صف {e.row}: {e.message}
                </p>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
