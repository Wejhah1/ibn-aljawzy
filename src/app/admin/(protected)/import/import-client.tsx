"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { importStudentsAction, type ImportRow, type ImportResult } from "./actions";
import { UploadCloud, FileSpreadsheet, CheckCircle2, AlertTriangle, Download } from "lucide-react";

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
  "العنوان": "address",
  "ملاحظات": "notes",
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
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const handleFile = async (file: File) => {
    setFileName(file.name);
    setResult(null);
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const raw: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    const parsed: ImportRow[] = raw.map((r) => {
      const row: Partial<ImportRow> = {};
      for (const [header, value] of Object.entries(r)) {
        const key = COLUMN_MAP[header.trim()];
        if (!key) continue;
        if (key === "birth_date") {
          row[key] = excelDateToIso(value);
        } else {
          const str = String(value ?? "").trim();
          if (str) (row as Record<string, string>)[key] = str;
        }
      }
      return row as ImportRow;
    }).filter((r) => r.full_name || r.guardian_phone);

    setRows(parsed);
  };

  const runImport = async () => {
    setImporting(true);
    const res = await importStudentsAction(rows, currentSeason?.id ?? null);
    setResult(res);
    setImporting(false);
  };

  const downloadTemplate = () => {
    const wsData = [
      ["كود", "الاسم", "جوال ولي الأمر", "اسم ولي الأمر", "صلة القرابة", "تاريخ الميلاد", "رقم الهوية", "العنوان", "ملاحظات"],
      ["", "أحمد محمد السيد", "0512345678", "محمد السيد", "الأب", "2014-05-10", "", "", ""],
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "الطلاب");
    XLSX.writeFile(wb, "قالب_استيراد_الطلاب.xlsx");
  };

  return (
    <div className="space-y-(--space-6)">
      <Card>
        <div className="flex items-center justify-between mb-(--space-4)">
          <CardTitle>1. رفع الملف</CardTitle>
          <Button size="sm" variant="outline" onClick={downloadTemplate}>
            <Download size={14} /> تحميل قالب فارغ
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
                  <th className="p-(--space-2) text-right font-semibold">كود</th>
                  <th className="p-(--space-2) text-right font-semibold">الاسم</th>
                  <th className="p-(--space-2) text-right font-semibold">جوال ولي الأمر</th>
                  <th className="p-(--space-2) text-right font-semibold">ولي الأمر</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 50).map((r, i) => (
                  <tr key={i} className="border-t border-line">
                    <td className="p-(--space-2)">{r.code || <Badge tone="brand">جديد</Badge>}</td>
                    <td className="p-(--space-2) font-semibold">{r.full_name}</td>
                    <td className="p-(--space-2)" dir="ltr">
                      {r.guardian_phone}
                    </td>
                    <td className="p-(--space-2)">{r.guardian_name}</td>
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
          {currentSeason && (
            <CardDescription className="mt-(--space-2)">
              سيتم تسجيل الطلاب الجدد تلقائياً في الموسم الحالي: {currentSeason.name}
            </CardDescription>
          )}
          <div className="flex justify-end mt-(--space-4)">
            <Button onClick={runImport} disabled={importing}>
              {importing ? "جارِ الاستيراد..." : `استيراد ${rows.length} طالب`}
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
          <div className="flex items-center gap-(--space-4) mb-(--space-3)">
            <Badge tone="success">{result.created} طالب جديد</Badge>
            <Badge tone="info">{result.updated} تحديث</Badge>
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
