import { createClient } from "@/lib/supabase/server";
import { Card, CardStat, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, UserCheck, Flag, Trophy, Calendar, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: currentSeason } = await supabase
    .from("seasons")
    .select("id, name, end_date, start_date")
    .eq("status", "current")
    .maybeSingle();

  let stats = { totalStudents: 0, activeEnrollments: 0, unresolvedFlags: 0, presentToday: 0 };
  let topStudents: { full_name: string; total_points: number; code: string }[] = [];
  let recentAudit: { action: string; created_at: string; entity_type: string }[] = [];

  if (currentSeason) {
    const [{ count: activeEnrollments }, { count: unresolvedFlags }, { data: leaders }, { data: audit }] =
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
      ]);

    stats.activeEnrollments = activeEnrollments ?? 0;
    stats.unresolvedFlags = unresolvedFlags ?? 0;
    topStudents = (leaders ?? []).map((l) => {
      const s = Array.isArray(l.students) ? l.students[0] : l.students;
      return { full_name: s?.full_name ?? "—", code: s?.code ?? "—", total_points: l.total_points };
    });
    recentAudit = audit ?? [];
  }

  const { count: totalStudents } = await supabase
    .from("students")
    .select("id", { count: "exact", head: true })
    .eq("status", "active");
  stats.totalStudents = totalStudents ?? 0;

  const daysLeft = currentSeason
    ? Math.ceil((new Date(currentSeason.end_date).getTime() - Date.now()) / 86400000)
    : null;

  return (
    <main className="p-(--space-4) md:p-(--space-8) max-w-[1200px] mx-auto">
      <div className="mb-(--space-8)">
        <h1 className="text-[22px] leading-[30px] font-bold text-ink">الرئيسية</h1>
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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-(--space-4) mb-(--space-8)">
        <CardStat>
          <div className="flex items-center justify-between mb-(--space-2)">
            <Users size={18} className="text-brand" />
          </div>
          <p className="text-[30px] leading-[36px] font-bold text-ink">{stats.totalStudents}</p>
          <p className="text-[12px] text-ink-muted font-medium mt-1">إجمالي الطلاب النشطين</p>
        </CardStat>
        <CardStat>
          <div className="flex items-center justify-between mb-(--space-2)">
            <UserCheck size={18} className="text-brand" />
          </div>
          <p className="text-[30px] leading-[36px] font-bold text-ink">{stats.activeEnrollments}</p>
          <p className="text-[12px] text-ink-muted font-medium mt-1">مسجّلون في الموسم الحالي</p>
        </CardStat>
        <CardStat className={stats.unresolvedFlags > 0 ? "border-warning" : undefined}>
          <div className="flex items-center justify-between mb-(--space-2)">
            <Flag size={18} className="text-warning" />
          </div>
          <p className="text-[30px] leading-[36px] font-bold text-ink">{stats.unresolvedFlags}</p>
          <p className="text-[12px] text-ink-muted font-medium mt-1">علامات تحتاج إجراء</p>
        </CardStat>
        <CardStat>
          <div className="flex items-center justify-between mb-(--space-2)">
            <Calendar size={18} className="text-info" />
          </div>
          <p className="text-[30px] leading-[36px] font-bold text-ink">{daysLeft ?? "—"}</p>
          <p className="text-[12px] text-ink-muted font-medium mt-1">يوم متبقٍ لنهاية الموسم</p>
        </CardStat>
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
                  {new Date(a.created_at).toLocaleString("ar-SA", { dateStyle: "short", timeStyle: "short" })}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </main>
  );
}
