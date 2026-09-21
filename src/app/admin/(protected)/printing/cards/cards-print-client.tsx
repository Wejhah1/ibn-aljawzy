"use client";

import { Button } from "@/components/ui/button";
import { Barcode } from "@/components/print/Barcode";
import type { StudentCardConfig } from "@/lib/print/types";
import type { ProgramInfo } from "@/lib/settings";
import { Printer } from "lucide-react";

interface StudentCard {
  id: string;
  code: string;
  fullName: string;
  circleName: string | null;
  groupName: string | null;
}

const CARDS_PER_PAGE = 8;

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export function CardsPrintClient({
  students,
  circles,
  groups,
  selectedCircle,
  selectedGroup,
  cardConfig,
  programInfo,
}: {
  students: StudentCard[];
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
            <StudentCardFace key={s.id} student={s} cardConfig={cardConfig} programInfo={programInfo} />
          ))}
        </div>
      ))}
    </main>
  );
}

function StudentCardFace({
  student,
  cardConfig,
  programInfo,
}: {
  student: StudentCard;
  cardConfig: StudentCardConfig;
  programInfo: ProgramInfo;
}) {
  const accent = cardConfig.accentColor;
  const logoPx = cardConfig.logoSize / 2.2;

  return (
    <div
      className="relative flex flex-col rounded-2xl overflow-hidden shadow-lg shrink-0"
      style={{
        width: "85mm",
        height: "54mm",
        backgroundColor: cardConfig.bgColor,
        color: cardConfig.textColor,
        border: `1px solid ${accent}33`,
      }}
    >
      <div className="h-2 w-full shrink-0" style={{ background: `linear-gradient(90deg, ${accent}, ${accent}88, ${accent})` }} />

      <svg className="absolute -top-6 -left-6 opacity-10" width="90" height="90" viewBox="0 0 90 90" fill={accent}>
        <path d="M45 5l10 25 25 10-25 10-10 25-10-25-25-10 25-10z" />
      </svg>
      <svg className="absolute -bottom-8 -right-8 opacity-[0.06]" width="120" height="120" viewBox="0 0 120 120" fill={accent}>
        <circle cx="60" cy="60" r="50" />
      </svg>

      <div className="relative flex items-center justify-between gap-2 px-3 pt-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.svg" alt="" style={{ height: logoPx, width: logoPx }} className="object-contain shrink-0" />
        <div className="text-center flex-1 min-w-0">
          <div className="text-[10px] font-semibold leading-tight truncate" style={{ color: accent }}>
            {programInfo.program_name}
          </div>
          <div className="text-[9px] opacity-70 leading-tight truncate">{programInfo.mosque_name}</div>
        </div>
        {cardConfig.showSecondaryLogo && programInfo.secondary_logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={programInfo.secondary_logo_url}
            alt=""
            style={{ height: logoPx, width: logoPx }}
            className="object-contain shrink-0"
          />
        ) : (
          <div style={{ height: logoPx, width: logoPx }} className="shrink-0" />
        )}
      </div>

      <div className="relative flex-1 flex flex-col items-center justify-center text-center px-3">
        <div className="font-bold text-lg leading-tight">{student.fullName}</div>
        <div className="mt-1 flex flex-wrap items-center justify-center gap-1">
          {cardConfig.showCircle && student.circleName && (
            <span
              className="inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium"
              style={{ backgroundColor: `${accent}22`, color: accent }}
            >
              {student.circleName}
            </span>
          )}
          {cardConfig.showGroup && student.groupName && (
            <span
              className="inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium"
              style={{ backgroundColor: `${accent}22`, color: accent }}
            >
              {student.groupName}
            </span>
          )}
        </div>
      </div>

      <div className="relative flex flex-col items-center pb-2">
        <Barcode value={student.code} color={cardConfig.barcodeColor} height={38} width={2.2} fontSize={14} />
      </div>
    </div>
  );
}
