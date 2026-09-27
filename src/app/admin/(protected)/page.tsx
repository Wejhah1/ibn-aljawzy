import { createClient } from "@/lib/supabase/server";
import { Card, CardStat, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { Users, MessageSquare, Flag, Trophy, Calendar, AlertTriangle, ClipboardList, ListChecks } from "lucide-react";
import Link from "next/link";
import { hijriDateTime, hijriWeekday } from "@/lib/date";

const TODAY_STATUSES = [
  { key: "present", label: "حاضر", tone: "success" },
  { key: "late", label: "متأخر", tone: "warning" },
  { key: "excused", label: "بعذر", tone: "info" },
  { key: "absent", label: "غائب", tone: "danger" },
] as const;

export default async function DashboardPage() {
  const supabase = await createClient();

  const todayIso = new Date().toISOString().slice(0, 10);
  const [{ data: currentSeason }, { count: totalStudents }, { count: unreadNotes }] = await Promise.all([
    supabase.from("seasons").select("id, name, end_date, start_date").eq("status", "current").maybeSingle(),
    supabase.from("students").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase
      .from("parent_notes")
      .select("id", { count: "exact", head: true })
      .eq("sender", "parent")
      .eq("is_read_by_admin", false),
  ]);

  const stats = { totalStudents: totalStudents ?? 0, activeEnrollments: 0, unresolvedFlags: 0, unreadNotes: unreadNotes ?? 0 };
  let today: { dayDate: string; isHoliday: boolean; counts: Record<string, number>; marked: number } | null = null;
  let topStudents: { full_name: string; total_points: number; code: string }[] = [];
  let recentAudit: { action: string; created_at: string; entity_type: string }[] = [];

  if (currentSeason) {
    const [{ count: activeEnrollments }, { count: unresolvedFlags }, { data: leaders }, { data: audit }, { data: todayDay }] =
      await Promise.all([
        supabase
          .from("student_season_enrollments")
          .select("id", { count: "exact", head: true })
          .eq("season_id", currentSeason.id)
          .eq("status", "active"),
        supabase
          .from("student_flags")
          .select("id", { count: "exact", head: true })
          .eq("is_resolved", false),
        supabase
          .from("student_season_enrollments")
          .select("total_points, students(full_name, code)")
          .eq("season_id", currentSeason.id)
          .order("total_points", { ascending: false })
          .limit(5),
        supabase.from("audit_log").select("action, created_at, entity_type").order("created_at", { ascending: false }).limit(8),
        supabase
          .from("program_days")
          .select("id, day_date, is_holiday")
          .eq("season_id", currentSeason.id)
          .eq("day_date", todayIso)
          .maybeSingle(),
      ]);

    if (todayDay) {
      const { data: records } = await supabase.from("attendance_records").select("status").eq("program_day_id", todayDay.id);
      const counts: Record<string, number> = { present: 0, late: 0, excused: 0, absent: 0 };
      for (const r of records ?? []) counts[r.status] = (counts[r.status] ?? 0) + 1;
      today = { dayDate: todayDay.day_date, isHoliday: todayDay.is_holiday, counts, marked: records?.length ?? 0 };
    }

    stats.activeEnrollments = activeEnrollments ?? 0;
    stats.unresolvedFlags = unresolvedFlags ?? 0;
    topStudents = (leaders ?? []).map((l) => {
      const s = Array.isArray(l.students) ? l.students[0] : l.students;
      return { full_name: s?.full_name ?? "—", code: s?.code ?? "—", total_points: l.total_points };
    });
    recentAudit = audit ?? [];
  }

  const daysLeft = currentSeason
    ? Math.ceil((new Date(currentSeason.end_date).getTime() - Date.now()) / 86400000)
    : null;

  return (
    <main className="p-(--space-4) md:p-(--space-8) max-w-[1200px] mx-auto">
      <div className="mb-(--space-8)">
        <h1 className="max-md:hidden text-[22px] leading-[30px] font-bold text-ink">الرئيسية</h1>
        <p className="text-sm text-ink-muted mt-1">
          {currentSeason ? `الموسم الحالي: ${currentSeason.name}` : "لا يوجد موسم حالي — أنشئ موسماً من الإدارة"}
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
        <Card className="mb-(--space-6) border-bold border-line-strong shadow-brutal flex flex-col items-center text-center gap-(--space-3) py-(--space-5)">
          <div>
            <CardTitle>حضور اليوم</CardTitle>
            <CardDescription>{hijriWeekday(todayIso)}</CardDescription>
          </div>
          {!today ? (
            <p className="text-sm text-ink-muted">لا يوجد يوم دراسي اليوم.</p>
          ) : today.isHoliday ? (
            <p className="text-sm font-semibold text-danger">اليوم عطلة.</p>
          ) : (
            <>
              <div className="flex h-3 w-full max-w-[520px] overflow-hidden rounded-full border border-line bg-neutral-soft">
                {TODAY_STATUSES.map((s) =>
                  today!.counts[s.key] > 0 ? (
                    <span
                      key={s.key}
                      style={{
                        width: `${(today!.counts[s.key] / Math.max(stats.activeEnrollments, today!.marked, 1)) * 100}%`,
                        backgroundColor: `var(--color-${s.tone})`,
                      }}
                    />
                  ) : null
                )}
              </div>
              <p className="text-[13px] text-ink-muted">
                {today.marked} من {stats.activeEnrollments} مسجّلون
                {today.counts.absent > 0 ? `، ${today.counts.absent} غائب` : ""}
              </p>
              <div className="grid grid-cols-2 gap-(--space-3) w-full max-w-[420px]">
                <Link href="/admin/attendance?end=1" className={buttonClasses("secondary")}>
                  <ListChecks size={16} /> إنهاء اليوم
                </Link>
                <Link href="/admin/attendance" className={buttonClasses("primary")}>
                  <ClipboardList size={16} /> {today.marked === 0 ? "ابدأ تحضير اليوم" : "أكمل التحضير"}
                </Link>
              </div>
            </>
          )}
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-(--space-4) mb-(--space-8)">
        <StatTile icon={<Users size={18} className="text-brand" />} value={stats.totalStudents} label="طالب نشط" />
        <StatTile icon={<Calendar size={18} className="text-info" />} value={daysLeft ?? "—"} label="يوم متبقٍ لنهاية الموسم" />
        <StatTile
          icon={<Flag size={18} className="text-warning" />}
          value={stats.unresolvedFlags}
          label="علامات تحتاج إجراء"
          valueClassName={stats.unresolvedFlags > 0 ? "text-warning" : undefined}
        />
        <StatTile icon={<MessageSquare size={18} className="text-brand" />} value={stats.unreadNotes} label="رسائل أولياء أمور جديدة" />
      </div>

      <div className="grid md:grid-cols-2 gap-(--space-6)">
        <Card>
          <div className="flex items-center justify-between mb-(--space-4)">
            <CardTitle className="flex items-center gap-2">
              <Trophy size={18} className="text-accent" /> أفضل 5 طلاب
            </CardTitle>
            <Link href="/admin/leaderboard" className="text-[13px] font-semibold text-brand">
              عرض الكل
            </Link>
          </div>
          <div className="space-y-(--space-2)">
            {topStudents.length === 0 && <CardDescription>لا توجد بيانات نقاط بعد.</CardDescription>}
            {topStudents.map((s, i) => (
              <div key={i} className="flex items-center justify-between rounded-(--radius-sm) bg-surface-sunken px-(--space-3) py-(--space-2)">
                <div className="flex items-center gap-(--space-3)">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-soft text-accent text-[12px] font-bold">
                    {i + 1}
                  </span>
                  <span className="text-sm font-semibold text-ink">{s.full_name}</span>
                  <Badge tone="neutral">#{s.code}</Badge>
                </div>
                <span className="text-sm font-bold text-brand">{s.total_points} نقطة</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardTitle className="mb-(--space-4)">آخر العمليات</CardTitle>
          <div className="space-y-(--space-3)">
            {recentAudit.length === 0 && <CardDescription>لا توجد عمليات مسجّلة بعد.</CardDescription>}
            {recentAudit.map((a, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-ink-muted">{a.action}</span>
                <span className="text-[12px] text-ink-faint">
                  {hijriDateTime(a.created_at)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </main>
  );
}

function StatTile({
  icon,
  value,
  label,
  valueClassName,
}: {
  icon: React.ReactNode;
  value: number | string;
  label: string;
  valueClassName?: string;
}) {
  return (
    <CardStat className="flex flex-col items-center text-center">
      <div className="mb-(--space-2)">{icon}</div>
      <p className={`text-[30px] leading-[36px] font-bold text-ink ${valueClassName ?? ""}`}>{value}</p>
      <p className="text-[12px] text-ink-muted font-medium mt-1">{label}</p>
    </CardStat>
  );
}
