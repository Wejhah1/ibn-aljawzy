"use client";

import { Button } from "@/components/ui/button";
import type { ProgramInfo } from "@/lib/settings";
import { Printer } from "lucide-react";

interface ReportRow {
  studentId: string;
  code: string;
  fullName: string;
  circleName: string | null;
  groupName: string | null;
  present: number;
  late: number;
  excused: number;
  absent: number;
  attendanceRate: number;
  points: number;
  flags: string[];
}

interface Summary {
  totalPoints: number;
  avgAttendance: number;
  absent: number;
  excused: number;
  late: number;
  present: number;
  studentCount: number;
}

export function ClassicReportClient({
  programInfo,
  seasonName,
  startDate,
  endDate,
  dayCount,
  circles,
  groups,
  selectedCircle,
  selectedGroup,
  rows,
  summary,
}: {
  programInfo: ProgramInfo;
  seasonName: string;
  startDate: string;
  endDate: string;
  dayCount: number;
  circles: { id: string; name: string }[];
  groups: { id: string; name: string }[];
  selectedCircle: string;
  selectedGroup: string;
  rows: ReportRow[];
  summary: Summary;
}) {
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("ar-SA", { weekday: "long", day: "numeric", month: "numeric", year: "numeric" });

  return (
    <main className="p-(--space-4) md:p-(--space-8)">
      <style>{`@media print { @page { size: A4; margin: 10mm; } }`}</style>

      <div className="print:hidden mb-(--space-6)">
        <div className="flex items-center justify-between flex-wrap gap-(--space-3) mb-(--space-4)">
          <div>
            <h1 className="text-[22px] leading-[30px] font-bold text-ink">التقرير الكلاسيكي — الحضور والنقاط</h1>
            <p className="text-sm text-ink-muted mt-1">{rows.length} طالب</p>
          </div>
          <Button onClick={() => window.print()}>
            <Printer size={16} /> طباعة
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

      {/* رأس التقرير القابل للطباعة */}
      <div className="flex items-center justify-between border-b-2 border-ink pb-(--space-4) mb-(--space-4)">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft text-accent font-bold text-2xl border-2 border-ink shrink-0">
          ا
        </div>
        <div className="text-center flex-1">
          <p className="text-[20px] font-bold text-brand">{programInfo.program_name}</p>
          <p className="text-[12px] text-ink-muted">{programInfo.mosque_name}</p>
          <p className="text-[15px] font-bold text-ink mt-(--space-2)">تقرير الحضور والنقاط</p>
          <p className="text-[11px] text-ink-muted mt-1">
            من {fmt(startDate)} إلى {fmt(endDate)} · عدد أيام الدوام: {dayCount}
          </p>
        </div>
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-soft text-brand-hover font-bold text-2xl border-2 border-ink shrink-0">
          ا
        </div>
      </div>

      <div className="grid grid-cols-7 gap-(--space-2) mb-(--space-5)">
        <StatBox label="مجموع النقاط" value={summary.totalPoints} tone="brand" />
        <StatBox label="متوسط الحضور" value={`${summary.avgAttendance}%`} tone="brand" />
        <StatBox label="غياب" value={summary.absent} tone="danger" />
        <StatBox label="غياب بعذر" value={summary.excused} tone="info" />
        <StatBox label="تأخر" value={summary.late} tone="warning" />
        <StatBox label="حضور" value={summary.present} tone="success" />
        <StatBox label="عدد الطلاب" value={summary.studentCount} tone="neutral" />
      </div>

      <table className="w-full text-[11px] border-collapse">
        <thead>
          <tr className="border-b-2 border-ink">
            <th className="p-1.5 text-right font-bold">#</th>
            <th className="p-1.5 text-right font-bold">الاسم</th>
            <th className="p-1.5 text-right font-bold">الحلقة</th>
            <th className="p-1.5 text-right font-bold">المجموعة</th>
            <th className="p-1.5 text-center font-bold">حاضر</th>
            <th className="p-1.5 text-center font-bold">متأخر</th>
            <th className="p-1.5 text-center font-bold">غياب بعذر</th>
            <th className="p-1.5 text-center font-bold">غائب</th>
            <th className="p-1.5 text-center font-bold">نسبة الحضور</th>
            <th className="p-1.5 text-center font-bold">النقاط</th>
            <th className="p-1.5 text-right font-bold">العلامات</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.studentId} className="border-b border-line" style={{ breakInside: "avoid" }}>
              <td className="p-1.5 text-ink-muted">{i + 1}</td>
              <td className="p-1.5 font-semibold text-ink">
                {r.fullName} <span className="text-ink-faint font-normal">#{r.code}</span>
              </td>
              <td className="p-1.5 text-ink-muted">{r.circleName ?? "—"}</td>
              <td className="p-1.5 text-ink-muted">{r.groupName ?? "—"}</td>
              <td className="p-1.5 text-center text-success font-semibold">{r.present}</td>
              <td className="p-1.5 text-center text-warning font-semibold">{r.late}</td>
              <td className="p-1.5 text-center text-info font-semibold">{r.excused}</td>
              <td className="p-1.5 text-center text-danger font-semibold">{r.absent}</td>
              <td className="p-1.5 text-center">
                <div className="flex items-center gap-1 justify-center">
                  <div className="h-1.5 w-14 rounded-full bg-surface-sunken overflow-hidden">
                    <div className="h-full bg-brand" style={{ width: `${r.attendanceRate}%` }} />
                  </div>
                  <span className="font-semibold">{r.attendanceRate}%</span>
                </div>
              </td>
              <td className="p-1.5 text-center font-bold text-brand">{r.points}</td>
              <td className="p-1.5 text-ink-muted">{r.flags.join("، ") || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {rows.length === 0 && <p className="text-center text-sm text-ink-muted py-(--space-8)">لا يوجد طلاب مطابقون.</p>}
    </main>
  );
}

function StatBox({ label, value, tone }: { label: string; value: string | number; tone: string }) {
  return (
    <div className="rounded-(--radius-sm) border border-line text-center py-(--space-2)">
      <p className="text-[18px] font-bold" style={{ color: tone === "neutral" ? "var(--color-ink)" : `var(--color-${tone})` }}>
        {value}
      </p>
      <p className="text-[10px] text-ink-muted font-semibold">{label}</p>
    </div>
  );
}
