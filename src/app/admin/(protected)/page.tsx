import { createClient } from "@/lib/supabase/server";
import { Card, CardStat, CardTitle } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate, dateTimeFormat, dayFormat } from "@/lib/format";
import { Users, UserCheck, Flag, Trophy, Calendar, AlertTriangle, ClipboardList, ScanLine, History, ChevronLeft, Sun } from "lucide-react";
import Link from "next/link";

const ACTION_LABELS: Record<string, string> = {
  "student.create": "أضاف طالباً جديداً",
  "students.import": "استورد قائمة طلاب من Excel",
  "student.dropout": "سجّل انقطاع طالب",
  "student.return": "أعاد طالباً منقطعاً",
  "circle.create": "أنشأ حلقة جديدة",
  "season.create": "أنشأ موسماً جديداً",
  "season.set_current": "فعّل موسماً حالياً",
  "season.archive": "أرشف موسماً",
};

const STATUS_BAR = [
  { key: "present", label: "حاضر", color: "var(--color-success)" },
  { key: "late", label: "متأخر", color: "var(--color-warning)" },
  { key: "excused", label: "بعذر", color: "var(--color-info)" },
  { key: "absent", label: "غائب", color: "var(--color-danger)" },
] as const;

// تاريخ اليوم بتوقيت الرياض بصيغة YYYY-MM-DD
function riyadhToday() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Riyadh" }).format(new Date());
}

function daysUntil(endDate: string) {
  return Math.ceil((new Date(`${endDate}T23:59:59+03:00`).getTime() - Date.now()) / 86400000);
}

function one<T>(v: T | T[] | null | undefined): T | null {
  if (!v) return null;
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const today = riyadhToday();

  const [{ data: currentSeason }, { count: totalStudents }] = await Promise.all([
    supabase.from("seasons").select("id, name, end_date, start_date").eq("status", "current").maybeSingle(),
    supabase.from("students").select("id", { count: "exact", head: true }).eq("status", "active"),
  ]);

  const stats = { totalStudents: totalStudents ?? 0, activeEnrollments: 0, unresolvedFlags: 0 };
  let topStudents: { full_name: string; total_points: number; code: string }[] = [];
  let recentAudit: { action: string; created_at: string; actor: string | null }[] = [];
  let todayDay: { id: string; is_holiday: boolean } | null = null;
  const todayCounts: Record<string, number> = { present: 0, late: 0, excused: 0, absent: 0 };

  if (currentSeason) {
    const [{ count: activeEnrollments }, { count: unresolvedFlags }, { data: leaders }, { data: audit }, { data: day }] = await Promise.all([
      supabase
        .from("student_season_enrollments")
        .select("id", { count: "exact", head: true })
        .eq("season_id", currentSeason.id)
        .eq("status", "active"),
      supabase.from("student_flags").select("id", { count: "exact", head: true }).eq("is_resolved", false),
      supabase
        .from("student_season_enrollments")
        .select("total_points, students(full_name, code)")
        .eq("season_id", currentSeason.id)
        .order("total_points", { ascending: false })
        .limit(5),
      supabase
        .from("audit_log")
        .select("action, created_at, profiles(full_name)")
        .order("created_at", { ascending: false })
        .limit(8),
      supabase.from("program_days").select("id, is_holiday").eq("season_id", currentSeason.id).eq("day_date", today).maybeSingle(),
    ]);

    stats.activeEnrollments = activeEnrollments ?? 0;
    stats.unresolvedFlags = unresolvedFlags ?? 0;
    topStudents = (leaders ?? []).map((l) => {
      const s = one(l.students);
      return { full_name: s?.full_name ?? "—", code: s?.code ?? "—", total_points: l.total_points };
    });
    recentAudit = (audit ?? []).map((a) => ({ action: a.action, created_at: a.created_at, actor: one(a.profiles)?.full_name ?? null }));
    todayDay = day;

    if (day && !day.is_holiday) {
      const { data: records } = await supabase.from("attendance_records").select("status").eq("program_day_id", day.id);
      for (const r of records ?? []) todayCounts[r.status] = (todayCounts[r.status] ?? 0) + 1;
    }
  }

  const daysLeft = currentSeason ? daysUntil(currentSeason.end_date) : null;
  const recorded = todayCounts.present + todayCounts.late + todayCounts.excused + todayCounts.absent;
  const unmarked = Math.max(0, stats.activeEnrollments - recorded);
  const barTotal = Math.max(stats.activeEnrollments, recorded, 1);

  return (
    <main className="p-(--space-4) md:p-(--space-8) max-w-[1200px] mx-auto">
      <div className="mb-(--space-6) md:mb-(--space-8)">
        <h1 className="text-[22px] leading-[30px] font-bold text-ink">الرئيسية</h1>
        <p className="text-sm text-ink-muted mt-1">
          {currentSeason ? `الموسم الحالي: ${currentSeason.name} · ${formatDate(today, dayFormat)}` : "لا يوجد موسم حالي"}
        </p>
      </div>

      {!currentSeason && (
        <Card className="mb-(--space-6) border-warning bg-warning-soft flex items-center gap-(--space-3)">
          <AlertTriangle className="text-warning shrink-0" size={20} />
          <p className="text-sm font-semibold text-warning">
            لا يوجد موسم حالي مفعّل.{" "}
            <Link href="/admin/seasons" className="underline">
              أنشئ موسماً جديداً
            </Link>{" "}
            لبدء تسجيل الحضور والنقاط.
          </p>
        </Card>
      )}

      {currentSeason && (
        <section className="mb-(--space-6) md:mb-(--space-8) grid gap-(--space-4) lg:grid-cols-[1fr_1.4fr]">
          <div className="grid grid-cols-2 gap-(--space-3)">
            <Link
              href="/admin/attendance"
              className="col-span-2 sm:col-span-1 lg:col-span-2 flex items-center gap-(--space-3) rounded-(--radius-md) bg-brand text-on-brand border-bold border-line-strong shadow-brutal p-(--space-4) transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-brutal-press hover:bg-brand-hover"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-(--radius-sm) bg-white/15">
                <ClipboardList size={22} />
              </span>
              <span className="min-w-0">
                <span className="block text-base font-bold">{recorded > 0 ? "متابعة تحضير اليوم" : "ابدأ تحضير اليوم"}</span>
                <span className="block text-xs opacity-90 mt-0.5">
                  {todayDay?.is_holiday ? "اليوم إجازة" : !todayDay ? "لا توجد حلقة مجدولة اليوم" : unmarked > 0 ? `لم يُسجَّل ${unmarked} طالباً بعد` : "اكتمل التحضير"}
                </span>
              </span>
              <ChevronLeft size={20} className="ms-auto shrink-0" />
            </Link>
            <Link
              href="/admin/quick-ops"
              className="col-span-2 sm:col-span-1 lg:col-span-2 flex items-center gap-(--space-3) rounded-(--radius-md) bg-surface-raised border-bold border-line-strong shadow-brutal-sm p-(--space-4) transition-all active:translate-x-[1px] active:translate-y-[1px] active:shadow-brutal-press hover:bg-surface-sunken"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-(--radius-sm) bg-brand-soft text-brand-hover">
                <ScanLine size={22} />
              </span>
              <span className="min-w-0">
                <span className="block text-base font-bold text-ink">مسح بطاقة طالب</span>
                <span className="block text-xs text-ink-muted mt-0.5">حضور ونقاط وأوسمة بلمسة</span>
              </span>
              <ChevronLeft size={20} className="ms-auto shrink-0 text-ink-faint" />
            </Link>
          </div>

          <Card className="flex flex-col justify-center">
            <div className="flex items-center justify-between mb-(--space-3)">
              <CardTitle className="flex items-center gap-2 text-base">
                <Sun size={18} className="text-accent" /> حضور اليوم
              </CardTitle>
              <span className="text-sm font-bold text-ink tabular-nums">
                {recorded} / {stats.activeEnrollments}
              </span>
            </div>
            {!todayDay || todayDay.is_holiday ? (
              <p className="text-sm text-ink-muted">{todayDay?.is_holiday ? "اليوم إجازة، لا يوجد تحضير." : "لا توجد حلقة مجدولة لهذا اليوم."}</p>
            ) : (
              <>
                <div className="flex h-3 w-full overflow-hidden rounded-full bg-surface-sunken border border-line" role="img" aria-label="توزيع حضور اليوم">
                  {STATUS_BAR.map((s) =>
                    todayCounts[s.key] > 0 ? (
                      <span key={s.key} className="h-full" style={{ width: `${(todayCounts[s.key] / barTotal) * 100}%`, backgroundColor: s.color }} />
                    ) : null
                  )}
                </div>
                <div className="flex flex-wrap gap-x-(--space-4) gap-y-1 mt-(--space-3)">
                  {STATUS_BAR.map((s) => (
                    <span key={s.key} className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-muted">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                      {s.label} <span className="text-ink tabular-nums">{todayCounts[s.key]}</span>
                    </span>
                  ))}
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-muted">
                    <span className="h-2.5 w-2.5 rounded-full bg-surface-sunken border border-line" />
                    لم يُسجَّل <span className="text-ink tabular-nums">{unmarked}</span>
                  </span>
                </div>
              </>
            )}
          </Card>
        </section>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-(--space-3) md:gap-(--space-4) mb-(--space-6) md:mb-(--space-8)">
        <StatTile icon={Users} color="text-brand" value={stats.totalStudents} label="إجمالي الطلاب النشطين" />
        <StatTile icon={UserCheck} color="text-brand" value={stats.activeEnrollments} label="مسجّلون في الموسم الحالي" />
        <StatTile
          icon={Flag}
          color="text-warning"
          value={stats.unresolvedFlags}
          label="علامات تحتاج إجراء"
          className={stats.unresolvedFlags > 0 ? "bg-warning-soft" : undefined}
        />
        <StatTile icon={Calendar} color="text-info" value={daysLeft !== null ? Math.max(0, daysLeft) : "—"} label="يوماً متبقياً على نهاية الموسم" />
      </div>

      <div className="grid md:grid-cols-2 gap-(--space-4) md:gap-(--space-6)">
        <Card>
          <div className="flex items-center justify-between mb-(--space-4)">
            <CardTitle className="flex items-center gap-2">
              <Trophy size={18} className="text-accent" /> أفضل 5 طلاب
            </CardTitle>
            <Link href="/admin/leaderboard" className="inline-flex items-center h-9 text-[13px] font-semibold text-brand">
              عرض الكل <ChevronLeft size={15} />
            </Link>
          </div>
          {topStudents.length === 0 ? (
            <EmptyState compact icon={Trophy} title="لا توجد بيانات نقاط بعد" />
          ) : (
            <ol className="space-y-(--space-2)">
              {topStudents.map((s, i) => (
                <li key={i} className="flex items-center gap-(--space-3) rounded-(--radius-sm) bg-surface-sunken px-(--space-3) py-(--space-2)">
                  <span className="w-5 text-center text-[13px] font-bold text-accent tabular-nums">{i + 1}</span>
                  <Avatar name={s.full_name} size={32} />
                  <span className="flex-1 min-w-0 text-sm font-semibold text-ink truncate">{s.full_name}</span>
                  <span className="text-sm font-bold text-brand tabular-nums shrink-0">{s.total_points} نقطة</span>
                </li>
              ))}
            </ol>
          )}
        </Card>

        <Card>
          <CardTitle className="mb-(--space-4) flex items-center gap-2">
            <History size={18} className="text-ink-muted" /> آخر العمليات
          </CardTitle>
          {recentAudit.length === 0 ? (
            <EmptyState compact icon={History} title="لا توجد عمليات مسجّلة بعد" />
          ) : (
            <ul className="divide-y divide-line">
              {recentAudit.map((a, i) => (
                <li key={i} className="flex items-center justify-between gap-(--space-3) py-(--space-2) text-sm">
                  <span className="text-ink min-w-0">
                    {a.actor && <span className="font-bold">{a.actor} </span>}
                    <span className={a.actor ? "text-ink-muted" : "text-ink"}>{ACTION_LABELS[a.action] ?? a.action}</span>
                  </span>
                  <span className="text-xs text-ink-faint shrink-0">{formatDate(a.created_at, dateTimeFormat)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </main>
  );
}

function StatTile({
  icon: Icon,
  color,
  value,
  label,
  className,
}: {
  icon: typeof Users;
  color: string;
  value: number | string;
  label: string;
  className?: string;
}) {
  return (
    <CardStat className={className}>
      <Icon size={18} className={`${color} mb-(--space-2)`} />
      <p className="text-[28px] md:text-[30px] leading-[36px] font-bold text-ink tabular-nums">{value}</p>
      <p className="text-xs text-ink-muted font-medium mt-1">{label}</p>
    </CardStat>
  );
}
