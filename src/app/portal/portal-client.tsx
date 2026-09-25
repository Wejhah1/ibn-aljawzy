"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, animate, motion, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import { toast } from "sonner";
import { Card, CardStat, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { parentLogoutAction, sendParentNoteAction, deleteParentNoteAction } from "./actions";
import { formatDate, dateTimeFormat, shortDayFormat } from "@/lib/format";
import { PushNotificationToggleCompact } from "@/components/push-notification-toggle";
import {
  Award,
  CalendarCheck,
  CheckCircle2,
  ChevronDown,
  Clock,
  FileWarning,
  LineChart,
  LogOut,
  Medal,
  MessageSquare,
  Send,
  Sparkles,
  Trash2,
  Trophy,
  XCircle,
  type LucideIcon,
} from "lucide-react";

export type AttendanceStatus = "present" | "late" | "excused" | "absent";

interface ParentNote {
  id: string;
  sender: string;
  message: string;
  createdAt: string;
}

interface Honor {
  name: string;
  icon: string | null;
}

export interface StudentData {
  id: string;
  code: string;
  fullName: string;
  photoUrl: string | null;
  status: string;
  circleName: string | null;
  groupName: string | null;
  circleColor: string | null;
  groupColor: string | null;
  totalPoints: number;
  circleRank: number | null;
  circleSize: number | null;
  attendance: Record<AttendanceStatus, number>;
  recentDays: { status: AttendanceStatus; date: string | null }[];
  lastAbsenceDate: string | null;
  achievements: Honor[];
  badges: Honor[];
  lockedBadges: Honor[];
  monthlyResults: { periodLabel: string; percentage: number | null; statusText: string | null }[];
  pointsLog: { id: string; points: number; label: string; createdAt: string }[];
  notes: ParentNote[];
  unreadAdminNotes: number;
}

// نفس أيقونات وألوان كشف الحضور في لوحة الإدارة، لتكون لغة بصرية واحدة
const STATUS_META: Record<AttendanceStatus, { label: string; icon: LucideIcon; tone: string }> = {
  present: { label: "حاضر", icon: CheckCircle2, tone: "success" },
  late: { label: "متأخر", icon: Clock, tone: "warning" },
  excused: { label: "بعذر", icon: FileWarning, tone: "info" },
  absent: { label: "غائب", icon: XCircle, tone: "danger" },
};
const STATUS_ORDER: AttendanceStatus[] = ["present", "late", "excused", "absent"];

function ColorTag({ label, token }: { label: string; token: string | null }) {
  const valid = token && /^group-[1-6]$/.test(token) ? token : null;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-(--radius-xs) px-2 py-0.5 text-xs font-semibold bg-neutral-soft text-ink-muted"
      style={valid ? { color: `var(--color-${valid}-fg)`, backgroundColor: `var(--color-${valid}-bg)` } : undefined}
    >
      {valid && <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: `var(--color-${valid}-fg)` }} />}
      {label}
    </span>
  );
}

function CountUp({ value, className }: { value: number; className?: string }) {
  const reduce = useReducedMotion();
  const mv = useMotionValue(reduce ? value : 0);
  const text = useTransform(mv, (v) => Math.round(v).toLocaleString("en-US"));
  useEffect(() => {
    if (reduce) {
      mv.set(value);
      return;
    }
    const controls = animate(mv, value, { duration: 0.9, ease: [0.2, 0, 0, 1] });
    return () => controls.stop();
  }, [value, reduce, mv]);
  return <motion.span className={className}>{text}</motion.span>;
}

function SectionTitle({ icon: Icon, color, children, extra }: { icon: LucideIcon; color: string; children: React.ReactNode; extra?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-(--space-2) mb-(--space-4)">
      <CardTitle className="flex items-center gap-2 text-[17px]">
        <span className="flex h-8 w-8 items-center justify-center rounded-(--radius-sm)" style={{ backgroundColor: `var(--color-${color}-soft)`, color: `var(--color-${color})` }}>
          <Icon size={17} strokeWidth={2.25} />
        </span>
        {children}
      </CardTitle>
      {extra}
    </div>
  );
}

export function PortalClient({ students, seasonName }: { students: StudentData[]; seasonName: string | null }) {
  const [selectedId, setSelectedId] = useState(students[0]?.id);
  const selected = students.find((s) => s.id === selectedId) ?? students[0];

  return (
    <main className="min-h-screen bg-surface pb-(--space-12)">
      <header className="sticky top-0 z-30 border-b border-line bg-surface-raised/95 backdrop-blur pt-[env(safe-area-inset-top)]">
        <div className="max-w-[720px] mx-auto px-(--space-4) h-16 flex items-center justify-between gap-(--space-3)">
          <div className="flex items-center gap-(--space-2) min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-(--radius-sm) bg-surface-raised border-bold border-line-strong overflow-hidden p-0.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.svg" alt="شعار حلقات ابن الجوزي" className="h-full w-full object-contain" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-ink leading-tight">بوابة ولي الأمر</p>
              {seasonName && <p className="text-xs text-ink-muted truncate">{seasonName}</p>}
            </div>
          </div>
          <div className="flex items-center gap-(--space-2) shrink-0">
            <PushNotificationToggleCompact compact />
            <form action={parentLogoutAction}>
              <button
                type="submit"
                aria-label="تسجيل الخروج"
                className="flex h-9 items-center gap-1.5 rounded-(--radius-sm) px-2.5 text-[13px] font-semibold text-ink-muted hover:bg-danger-soft hover:text-danger transition-colors"
              >
                <LogOut size={16} />
                <span className="hidden sm:inline">خروج</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="max-w-[720px] mx-auto px-(--space-4) pt-(--space-4) md:pt-(--space-8)">
        {students.length > 1 && (
          <div className="flex items-center gap-(--space-2) mb-(--space-4) overflow-x-auto pb-1 -mx-(--space-4) px-(--space-4)" role="tablist" aria-label="اختر الابن">
            {students.map((s) => {
              const active = selected?.id === s.id;
              return (
                <button
                  key={s.id}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setSelectedId(s.id)}
                  className={`relative flex items-center gap-2 h-12 ps-1.5 pe-(--space-4) rounded-full border-bold border-line-strong text-sm font-bold whitespace-nowrap transition-colors ${
                    active ? "text-on-brand" : "bg-surface-raised text-ink-muted"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="portal-child-pill"
                      className="absolute inset-0 rounded-full bg-brand shadow-brutal-sm"
                      transition={{ type: "spring", stiffness: 500, damping: 38 }}
                    />
                  )}
                  <Avatar name={s.fullName} src={s.photoUrl} size={36} className="relative" />
                  <span className="relative">{s.fullName.split(" ")[0]}</span>
                </button>
              );
            })}
          </div>
        )}

        {!selected ? (
          <Card>
            <EmptyState icon={Trophy} title="لا توجد بيانات لعرضها" />
          </Card>
        ) : (
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={selected.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: [0.2, 0, 0, 1] }}
              className="space-y-(--space-4)"
            >
              <StudentHero student={selected} />
              <AttendanceCard student={selected} />
              <PointsLogCard student={selected} />
              <HonorsCard student={selected} />
              <MonthlyResultsCard student={selected} />
              <Card id="notes">
                <SectionTitle
                  icon={MessageSquare}
                  color="brand"
                  extra={
                    selected.unreadAdminNotes > 0 ? (
                      <span className="rounded-full bg-danger text-on-danger px-2 py-0.5 text-xs font-bold">
                        {selected.unreadAdminNotes} جديدة
                      </span>
                    ) : null
                  }
                >
                  التواصل مع الإدارة
                </SectionTitle>
                <ParentNotesPanel key={selected.id} studentId={selected.id} notes={selected.notes} />
              </Card>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </main>
  );
}

function StudentHero({ student }: { student: StudentData }) {
  const lastResult = [...student.monthlyResults].reverse().find((m) => m.percentage !== null) ?? null;
  return (
    <CardStat className="p-(--space-4)">
      <div className="flex items-center gap-(--space-3)">
        <Avatar name={student.fullName} src={student.photoUrl} size={64} bordered />
        <div className="min-w-0 flex-1">
          <h1 className="text-[19px] leading-snug font-bold text-ink text-balance">{student.fullName}</h1>
          <div className="flex items-center flex-wrap gap-1.5 mt-1.5">
            {student.circleName && <ColorTag label={student.circleName} token={student.circleColor} />}
            {student.groupName && <ColorTag label={student.groupName} token={student.groupColor} />}
            {student.status === "dropped_out" && (
              <span className="rounded-(--radius-xs) bg-danger-soft text-danger px-2 py-0.5 text-xs font-semibold">منقطع</span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-(--space-2) mt-(--space-4)">
        <div className="rounded-(--radius-sm) bg-brand text-on-brand border-bold border-line-strong shadow-brutal-sm px-2 py-(--space-3) text-center">
          <Trophy size={16} className="mx-auto mb-1 opacity-90" />
          <CountUp value={student.totalPoints} className="block text-[24px] leading-none font-bold tabular-nums" />
          <span className="block text-xs font-semibold opacity-90 mt-1">نقطة</span>
        </div>
        <div className="rounded-(--radius-sm) bg-surface-sunken px-2 py-(--space-3) text-center">
          <Medal size={16} className="mx-auto mb-1 text-accent" />
          <span className="block text-[24px] leading-none font-bold text-ink tabular-nums">{student.circleRank ? `#${student.circleRank}` : "—"}</span>
          <span className="block text-xs font-semibold text-ink-muted mt-1">
            {student.circleRank && student.circleSize ? `من ${student.circleSize} في الحلقة` : "الترتيب في الحلقة"}
          </span>
        </div>
        <div className="rounded-(--radius-sm) bg-surface-sunken px-2 py-(--space-3) text-center">
          <LineChart size={16} className="mx-auto mb-1 text-info" />
          <span className="block text-[24px] leading-none font-bold text-ink tabular-nums">{lastResult ? `${lastResult.percentage}%` : "—"}</span>
          <span className="block text-xs font-semibold text-ink-muted mt-1 truncate">{lastResult ? lastResult.periodLabel : "آخر نتيجة"}</span>
        </div>
      </div>
    </CardStat>
  );
}

function attendanceVerdict(rate: number | null) {
  if (rate === null) return { title: "لم يُسجَّل حضور بعد", tone: "neutral" };
  if (rate >= 90) return { title: "حضوره ممتاز، بارك الله فيه", tone: "success" };
  if (rate >= 75) return { title: "حضوره جيد، ونطمح إلى المزيد", tone: "success" };
  if (rate >= 50) return { title: "حضوره متوسط ويحتاج إلى متابعة", tone: "warning" };
  return { title: "حضوره ضعيف، نرجو التواصل مع الإدارة", tone: "danger" };
}

function AttendanceCard({ student }: { student: StudentData }) {
  const a = student.attendance;
  const total = a.present + a.late + a.excused + a.absent;
  const attended = a.present + a.late;
  // الغياب بعذر لا يُحتسب ضد الطالب
  const base = attended + a.absent;
  const rate = base > 0 ? Math.round((attended / base) * 100) : null;
  const verdict = attendanceVerdict(rate);
  const ringColor = verdict.tone === "neutral" ? "var(--color-line)" : `var(--color-${verdict.tone})`;
  const C = 2 * Math.PI * 15.5;

  return (
    <Card>
      <SectionTitle icon={CalendarCheck} color="success">
        الحضور هذا الموسم
      </SectionTitle>

      {total === 0 ? (
        <EmptyState compact icon={CalendarCheck} title="لم يُسجَّل حضور بعد" description="سيظهر هنا سجل حضور ابنك فور بدء التحضير في الحلقة." />
      ) : (
        <div className="space-y-(--space-4)">
          <div className="flex items-center gap-(--space-4)">
            <div className="relative h-[92px] w-[92px] shrink-0">
              <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90" aria-hidden>
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--color-surface-sunken)" strokeWidth="4" />
                <motion.circle
                  cx="18"
                  cy="18"
                  r="15.5"
                  fill="none"
                  stroke={ringColor}
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={C}
                  initial={{ strokeDashoffset: C }}
                  animate={{ strokeDashoffset: C - (C * (rate ?? 0)) / 100 }}
                  transition={{ duration: 1, ease: [0.2, 0, 0, 1], delay: 0.1 }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[22px] font-bold leading-none text-ink tabular-nums">{rate ?? 0}%</span>
                <span className="text-xs text-ink-muted mt-0.5">انتظام</span>
              </div>
            </div>
            <div className="min-w-0">
              <p className="text-[15px] font-bold leading-snug" style={{ color: verdict.tone === "neutral" ? undefined : `var(--color-${verdict.tone})` }}>
                {verdict.title}
              </p>
              <p className="text-[13px] text-ink-muted mt-1 leading-relaxed">
                حضر {attended} من {total} يوماً مسجّلاً
                {a.late > 0 ? `، منها ${a.late} ${a.late === 1 ? "مرة" : "مرات"} متأخراً` : ""}.
              </p>
              {student.lastAbsenceDate && (
                <p className="text-xs text-ink-faint mt-1">آخر غياب: {formatDate(student.lastAbsenceDate)}</p>
              )}
            </div>
          </div>

          <div className="flex h-2.5 w-full overflow-hidden rounded-full border border-line-strong" role="img" aria-label="توزيع أيام الحضور">
            {STATUS_ORDER.map((k) =>
              a[k] > 0 ? (
                <motion.span
                  key={k}
                  className="h-full"
                  style={{ backgroundColor: `var(--color-${STATUS_META[k].tone})` }}
                  initial={{ width: 0 }}
                  animate={{ width: `${(a[k] / total) * 100}%` }}
                  transition={{ duration: 0.7, ease: [0.2, 0, 0, 1], delay: 0.2 }}
                />
              ) : null
            )}
          </div>

          <div className="grid grid-cols-2 gap-(--space-2)">
            {STATUS_ORDER.map((k) => {
              const meta = STATUS_META[k];
              const Icon = meta.icon;
              return (
                <div key={k} className="flex items-center gap-(--space-3) rounded-(--radius-sm) px-(--space-3) py-(--space-2)" style={{ backgroundColor: `var(--color-${meta.tone}-soft)` }}>
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-(--radius-sm) border-bold border-line-strong"
                    style={{ backgroundColor: `var(--color-${meta.tone})`, color: `var(--color-on-${meta.tone})` }}
                  >
                    <Icon size={18} strokeWidth={2.25} />
                  </span>
                  <div>
                    <p className="text-[20px] font-bold leading-none tabular-nums" style={{ color: `var(--color-${meta.tone})` }}>
                      {a[k]}
                    </p>
                    <p className="text-xs font-semibold text-ink-muted mt-0.5">{meta.label}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {student.recentDays.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-ink-muted mb-(--space-2)">آخر {student.recentDays.length} يوماً</p>
              <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(14, minmax(0, 1fr))` }}>
                {student.recentDays.map((d, i) => (
                  <motion.span
                    key={`${d.date}-${i}`}
                    title={`${formatDate(d.date)} — ${STATUS_META[d.status].label}`}
                    className="aspect-square rounded-[4px] border border-line-strong/20"
                    style={{ backgroundColor: `var(--color-${STATUS_META[d.status].tone})` }}
                    initial={{ opacity: 0, scale: 0.4 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2, delay: 0.3 + i * 0.025 }}
                  />
                ))}
              </div>
              <div className="flex justify-between text-xs text-ink-faint mt-1">
                <span>{formatDate(student.recentDays[0]?.date ?? null, shortDayFormat)}</span>
                <span>{formatDate(student.recentDays[student.recentDays.length - 1]?.date ?? null, shortDayFormat)}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

function PointsLogCard({ student }: { student: StudentData }) {
  const [expanded, setExpanded] = useState(false);
  const items = expanded ? student.pointsLog : student.pointsLog.slice(0, 5);
  return (
    <Card>
      <SectionTitle icon={Sparkles} color="brand">
        سجل النقاط
      </SectionTitle>
      {student.pointsLog.length === 0 ? (
        <EmptyState compact icon={Sparkles} title="لا توجد حركات نقاط بعد" description="كل نقطة يكسبها ابنك أو تُخصم منه ستظهر هنا مع سببها." />
      ) : (
        <>
          <ul className="divide-y divide-line">
            {items.map((t) => {
              const positive = t.points >= 0;
              return (
                <li key={t.id} className="flex items-center gap-(--space-3) py-(--space-2)">
                  <span
                    className={`min-w-[48px] rounded-(--radius-xs) px-2 py-1 text-center text-sm font-bold tabular-nums ${
                      positive ? "bg-brand-soft text-brand-hover" : "bg-danger-soft text-danger"
                    }`}
                    dir="ltr"
                  >
                    {positive ? `+${t.points}` : `−${Math.abs(t.points)}`}
                  </span>
                  <span className="flex-1 min-w-0 text-sm font-semibold text-ink leading-snug">{t.label}</span>
                  <span className="text-xs text-ink-faint shrink-0">{formatDate(t.createdAt, shortDayFormat)}</span>
                </li>
              );
            })}
          </ul>
          {student.pointsLog.length > 5 && (
            <button
              onClick={() => setExpanded((e) => !e)}
              className="mt-(--space-2) flex w-full items-center justify-center gap-1 h-10 rounded-(--radius-sm) text-[13px] font-bold text-brand hover:bg-brand-soft"
            >
              {expanded ? "عرض أقل" : `عرض كل الحركات (${student.pointsLog.length})`}
              <ChevronDown size={15} className={`transition-transform ${expanded ? "rotate-180" : ""}`} />
            </button>
          )}
        </>
      )}
    </Card>
  );
}

function HonorsCard({ student }: { student: StudentData }) {
  const earned = [...student.achievements.map((a) => ({ ...a, kind: "إنجاز" })), ...student.badges.map((b) => ({ ...b, kind: "وسام" }))];
  const locked = student.lockedBadges.slice(0, Math.max(0, 8 - earned.length));
  return (
    <Card>
      <SectionTitle
        icon={Award}
        color="accent"
        extra={earned.length > 0 ? <span className="text-xs font-bold text-accent">{earned.length} مكتسبة</span> : null}
      >
        الإنجازات والأوسمة
      </SectionTitle>
      {earned.length === 0 && locked.length === 0 ? (
        <EmptyState compact icon={Award} title="لا توجد إنجازات أو أوسمة بعد" />
      ) : (
        <>
          <div className="grid grid-cols-4 gap-x-(--space-2) gap-y-(--space-4)">
            {earned.map((h, i) => (
              <motion.div
                key={`e-${i}`}
                className="flex flex-col items-center text-center gap-1.5"
                initial={{ opacity: 0, scale: 0.5, rotate: -15 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 420, damping: 16, delay: 0.1 + i * 0.06 }}
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft border-bold border-line-strong shadow-brutal-sm text-[26px] leading-none">
                  {h.icon || "🏅"}
                </span>
                <span className="text-xs font-bold text-ink leading-tight line-clamp-2">{h.name}</span>
              </motion.div>
            ))}
            {locked.map((h, i) => (
              <div key={`l-${i}`} className="flex flex-col items-center text-center gap-1.5" title="لم يحصل عليه بعد">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-sunken border-bold border-dashed border-ink-faint/50 text-[26px] leading-none grayscale opacity-45">
                  {h.icon || "🏅"}
                </span>
                <span className="text-xs font-semibold text-ink-faint leading-tight line-clamp-2">{h.name}</span>
              </div>
            ))}
          </div>
          {locked.length > 0 && (
            <p className="text-xs text-ink-faint mt-(--space-4) text-center">الأوسمة الباهتة لم يحصل عليها بعد، وهي هدفه القادم.</p>
          )}
        </>
      )}
    </Card>
  );
}

function gradeFor(p: number) {
  if (p >= 90) return { label: "ممتاز", tone: "success" };
  if (p >= 80) return { label: "جيد جداً", tone: "accent" };
  if (p >= 65) return { label: "جيد", tone: "info" };
  return { label: "يحتاج إلى متابعة", tone: "danger" };
}

function MonthlyResultsCard({ student }: { student: StudentData }) {
  return (
    <Card>
      <SectionTitle icon={LineChart} color="info">
        النتائج الشهرية
      </SectionTitle>
      {student.monthlyResults.length === 0 ? (
        <EmptyState compact icon={LineChart} title="لم تُنشر نتائج بعد" description="تظهر نتيجة كل اختبار شهري هنا فور اعتمادها." />
      ) : (
        <div className="space-y-(--space-4)">
          {student.monthlyResults.map((m, i) => {
            if (m.percentage === null) {
              return (
                <div key={i} className="flex items-center justify-between rounded-(--radius-sm) bg-surface-sunken px-(--space-3) py-(--space-2)">
                  <span className="text-sm font-semibold text-ink">{m.periodLabel}</span>
                  <span className="text-sm font-bold text-ink-muted">{m.statusText ?? "—"}</span>
                </div>
              );
            }
            const g = gradeFor(m.percentage);
            const color = g.tone === "accent" ? "var(--color-accent-solid)" : `var(--color-${g.tone})`;
            return (
              <div key={i}>
                <div className="flex items-baseline justify-between mb-1.5">
                  <span className="text-sm font-semibold text-ink">{m.periodLabel}</span>
                  <span className="text-sm font-bold tabular-nums" style={{ color: `var(--color-${g.tone})` }}>
                    {m.percentage}% · {g.label}
                  </span>
                </div>
                <div className="h-2.5 rounded-full bg-surface-sunken overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: color }}
                    initial={{ width: 0 }}
                    whileInView={{ width: `${Math.min(100, m.percentage)}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, ease: [0.2, 0, 0, 1] }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

function ParentNotesPanel({ studentId, notes }: { studentId: string; notes: ParentNote[] }) {
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [localNotes, setLocalNotes] = useState(notes);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const send = async () => {
    const trimmed = message.trim();
    if (!trimmed || pending) return;
    setPending(true);
    const tempId = `temp-${localNotes.length}-${trimmed.length}`;
    setLocalNotes((prev) => [...prev, { id: tempId, sender: "parent", message: trimmed, createdAt: new Date().toISOString() }]);
    setMessage("");
    const result = await sendParentNoteAction(studentId, trimmed);
    setPending(false);
    if (result?.error) {
      setLocalNotes((prev) => prev.filter((n) => n.id !== tempId));
      setMessage(trimmed);
      toast.error("تعذّر إرسال الرسالة، حاول مرة أخرى");
    } else {
      toast.success("وصلت رسالتك إلى الإدارة");
    }
  };

  const remove = async () => {
    if (!confirmId) return;
    setDeleting(true);
    const result = await deleteParentNoteAction(studentId, confirmId);
    setDeleting(false);
    if (result?.error) {
      toast.error("تعذّر حذف الرسالة");
    } else {
      setLocalNotes((prev) => prev.filter((n) => n.id !== confirmId));
      toast.success("حُذفت الرسالة");
    }
    setConfirmId(null);
  };

  return (
    <div>
      {localNotes.length === 0 ? (
        <p className="text-[13px] text-ink-muted mb-(--space-3) leading-relaxed">
          لديك استفسار أو ملاحظة عن ابنك؟ اكتبها هنا وستصل مباشرة إلى إدارة الحلقة.
        </p>
      ) : (
        <div className="space-y-(--space-2) mb-(--space-4) max-h-[340px] overflow-y-auto overscroll-contain rounded-(--radius-sm) bg-surface-sunken p-(--space-3)">
          <AnimatePresence initial={false}>
            {localNotes.map((n) => {
              const mine = n.sender !== "admin";
              return (
                <motion.div
                  key={n.id}
                  layout
                  initial={{ opacity: 0, y: 8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.18 }}
                  className={`flex ${mine ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className={`max-w-[85%] px-(--space-3) py-(--space-2) shadow-xs ${
                      mine
                        ? "bg-brand text-on-brand rounded-2xl rounded-ss-md"
                        : "bg-surface-raised text-ink border border-line rounded-2xl rounded-se-md"
                    }`}
                  >
                    {!mine && <p className="text-xs font-bold text-brand mb-0.5">الإدارة</p>}
                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{n.message}</p>
                    <div className={`flex items-center gap-(--space-2) mt-1 ${mine ? "text-on-brand/75" : "text-ink-faint"}`}>
                      <span className="text-xs">{n.id.startsWith("temp-") ? "جارٍ الإرسال..." : formatDate(n.createdAt, dateTimeFormat)}</span>
                      {mine && !n.id.startsWith("temp-") && (
                        <button
                          onClick={() => setConfirmId(n.id)}
                          aria-label="حذف الرسالة"
                          className="ms-auto -me-1 flex h-7 w-7 items-center justify-center rounded-full hover:bg-white/15"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
      <form
        className="flex gap-(--space-2)"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="اكتب رسالتك هنا..."
          aria-label="نص الرسالة"
          enterKeyHint="send"
          className="flex-1"
        />
        <Button type="submit" size="icon" disabled={!message.trim() || pending} aria-label="إرسال">
          <Send size={17} className="-scale-x-100" />
        </Button>
      </form>

      {confirmId && (
        <ConfirmDialog
          title="حذف الرسالة"
          message="هل تريد حذف هذه الرسالة؟ لن تتمكن الإدارة من رؤيتها بعد الحذف."
          confirmLabel="حذف"
          pending={deleting}
          onConfirm={remove}
          onCancel={() => setConfirmId(null)}
        />
      )}
    </div>
  );
}
