"use client";

import { Button } from "@/components/ui/button";
import type { StudentCardConfig } from "@/lib/print/types";
import type { ProgramInfo } from "@/lib/settings";
import { Printer } from "lucide-react";

interface StudentCard {
  id: string;
  code: string;
  fullName: string;
  birthDate: string | null;
  address: string | null;
  circleName: string | null;
}

const CARDS_PER_PAGE = 8;

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export function CardsPrintClient({
  students,
  barcodes,
  circles,
  groups,
  selectedCircle,
  selectedGroup,
  cardConfig,
  programInfo,
}: {
  students: StudentCard[];
  barcodes: Record<string, string>;
  circles: { id: string; name: string }[];
  groups: { id: string; name: string }[];
  selectedCircle: string;
  selectedGroup: string;
  cardConfig: StudentCardConfig;
  programInfo: ProgramInfo;
}) {
  const pages = chunk(students, CARDS_PER_PAGE);

  return (
    <main className="p-(--space-4) md:p-(--space-8)">
      <style>{`@media print { @page { size: A4; margin: 10mm; } }`}</style>

      <div className="print:hidden mb-(--space-6)">
        <div className="flex items-center justify-between flex-wrap gap-(--space-3) mb-(--space-4)">
          <div>
            <h1 className="text-[22px] leading-[30px] font-bold text-ink">طباعة بطاقات الطلاب</h1>
            <p className="text-sm text-ink-muted mt-1">{students.length} طالب — 8 بطاقات في كل ورقة A4</p>
          </div>
          <Button onClick={() => window.print()} disabled={students.length === 0}>
            <Printer size={16} /> طباعة الكل
          </Button>
        </div>
        <form method="get" className="flex flex-wrap gap-(--space-3) rounded-(--radius-md) border border-line bg-surface-raised p-(--space-4)">
          <div>
            <label className="block text-[12px] font-semibold text-ink-muted mb-1">الحلقة</label>
            <select
              name="circle"
              defaultValue={selectedCircle}
              className="h-11 rounded-(--radius-sm) border border-line bg-surface-raised px-(--space-3) text-sm text-ink"
            >
              <option value="">كل الحلقات</option>
              {circles.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-ink-muted mb-1">المجموعة</label>
            <select
              name="group"
              defaultValue={selectedGroup}
              className="h-11 rounded-(--radius-sm) border border-line bg-surface-raised px-(--space-3) text-sm text-ink"
            >
              <option value="">كل المجموعات</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" variant="secondary" className="self-end">
            تصفية
          </Button>
        </form>
      </div>

      {students.length === 0 && (
        <p className="text-sm text-ink-muted print:hidden">لا يوجد طلاب مطابقون للتصفية الحالية.</p>
      )}

      {pages.map((page, pageIndex) => (
        <div
          key={pageIndex}
          className="grid grid-cols-2 gap-[3mm] justify-items-center mb-[10mm]"
          style={{ pageBreakAfter: pageIndex < pages.length - 1 ? "always" : "auto" }}
        >
          {page.map((s) => (
            <StudentCardFace key={s.id} student={s} barcode={barcodes[s.code]} cardConfig={cardConfig} programInfo={programInfo} />
          ))}
        </div>
      ))}
    </main>
  );
}

function StudentCardFace({
  student,
  barcode,
  cardConfig,
  programInfo,
}: {
  student: StudentCard;
  barcode: string | undefined;
  cardConfig: StudentCardConfig;
  programInfo: ProgramInfo;
}) {
  return (
    <div
      className="border-bold border-line-strong rounded-[3mm] overflow-hidden flex shrink-0"
      style={{ width: "85.6mm", height: "54mm", background: "var(--color-surface-raised)" }}
    >
      <div
        className="w-[38%] p-[4mm] flex flex-col items-center justify-center text-center shrink-0"
        style={{ backgroundColor: "var(--color-accent-solid)", color: "var(--color-on-accent)" }}
      >
        <div
          className="h-[14mm] w-[14mm] rounded-full flex items-center justify-center font-bold mb-[3mm] border"
          style={{ backgroundColor: "var(--color-surface-raised)", color: "var(--color-accent)", borderColor: "var(--color-line-strong)", fontSize: "20px" }}
        >
          ا
        </div>
        <p className="font-script font-bold" style={{ fontSize: "15px" }}>
          بطاقة الطالب
        </p>
      </div>
      <div className="flex-1 p-[4mm] flex flex-col min-w-0">
        <p className="font-script font-bold text-brand" style={{ fontSize: "14px" }}>
          {programInfo.program_name}
        </p>
        <p className="font-script text-ink-sage mb-[3mm]" style={{ fontSize: "10px" }}>
          {programInfo.mosque_name}
        </p>
        <p className="font-script font-bold text-ink mb-[2mm] truncate" style={{ fontSize: "17px" }}>
          {student.fullName}
        </p>
        <p className="text-ink-muted" style={{ fontSize: "10px", fontFamily: "monospace" }}>
          كود: {student.code}
        </p>
        {student.circleName && (
          <p className="text-ink-muted truncate" style={{ fontSize: "9px" }}>
            {student.circleName}
          </p>
        )}
        {cardConfig.showBirthDate && student.birthDate && (
          <p className="text-ink-muted" style={{ fontSize: "9px" }}>
            الميلاد: {student.birthDate}
          </p>
        )}
        {cardConfig.showAddress && student.address && (
          <p className="text-ink-muted truncate" style={{ fontSize: "9px" }}>
            {student.address}
          </p>
        )}
        {barcode && (
          <div className="mt-auto text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={barcode} alt={student.code} style={{ width: "100%", height: "10mm", objectFit: "contain" }} />
          </div>
        )}
      </div>
    </div>
  );
}
