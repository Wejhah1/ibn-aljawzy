"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Card, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import {
  setAttendanceAction,
  bulkMarkPresentAction,
  bulkSendWhatsappAction,
  getStudentAttendanceHistoryAction,
  getAutoPointsSettingsAction,
  getAttendancePrintCirclesAction,
  type AttendancePrintCircle,
  saveAutoPointsSettingsAction,
  type AttendanceHistoryEntry,
  type AutoPointsSettings,
} from "./actions";
import { fillTemplate, buildWaMeLink, type WhatsappVariables } from "@/lib/whatsapp";
import { createClient } from "@/lib/supabase/client";
import type { ProgramInfo } from "@/lib/settings";
import { Input, Label } from "@/components/ui/input";
import {
  CheckCircle2,
  XCircle,
  Clock,
  FileWarning,
  Circle,
  MessageCircle,
  ListChecks,
  Send,
  Loader2,
  History,
  Search,
  Trophy,
  Settings2,
  Info,
  Printer,
  Download,
  X,
} from "lucide-react";
import { LottieLoader } from "@/components/ui/lottie-loader";

type Status = "present" | "absent" | "late" | "excused" | null;

interface Row {
  studentId: string;
  code: string;
  fullName: string;
  guardianPhone: string;
  circleId: string | null;
  groupId: string | null;
  circleName: string | null;
  groupName: string | null;
  status: Status;
}

const STATUS_META: Record<Exclude<Status, null>, { label: string; icon: typeof CheckCircle2; tone: string }> = {
  present: { label: "حاضر", icon: CheckCircle2, tone: "success" },
  late: { label: "متأخر", icon: Clock, tone: "warning" },
  excused: { label: "بعذر", icon: FileWarning, tone: "info" },
  absent: { label: "غائب", icon: XCircle, tone: "danger" },
};

export function AttendanceClient({
  seasonName,
  seasonId,
  programDays,
  selectedDay,
  circles,
  groups,
  selectedCircle,
  selectedGroup,
  rows: initialRows,
  programInfo,
  absentTemplate,
  lateTemplate,
}: {
  seasonName: string;
  seasonId: string;
  programDays: { id: string; day_date: string; is_holiday: boolean; note: string | null }[];
  selectedDay: { id: string; day_date: string; is_holiday: boolean; note: string | null } | null;
  circles: { id: string; name: string }[];
  groups: { id: string; name: string }[];
  selectedCircle: string;
  selectedGroup: string;
  rows: Row[];
  programInfo: ProgramInfo;
  absentTemplate: string;
  lateTemplate: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [circleFilter, setCircleFilter] = useState(selectedCircle);
  const [groupFilter, setGroupFilter] = useState(selectedGroup);
  const buildUrl = (day: string, circle: string, group: string) => {
    const params = new URLSearchParams();
    if (day) params.set("day", day);
    if (circle) params.set("circle", circle);
    if (group) params.set("group", group);
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  };
  // الحلقة والمجموعة: تصفية فورية محلياً (كل الطلاب محمّلون مسبقاً) مع تحديث الرابط بدون طلب للسيرفر
  const applyLocalFilter = (circle: string, group: string) => {
    setCircleFilter(circle);
    setGroupFilter(group);
    window.history.replaceState(null, "", buildUrl(selectedDay?.id ?? "", circle, group));
  };
  // اليوم: يُجلب من السيرفر (حالة الحضور تتغير) مع مؤشر تحميل
  const [dayPending, startDayTransition] = useTransition();
  const changeDay = (dayId: string) => {
    startDayTransition(() => {
      router.replace(buildUrl(dayId, circleFilter, groupFilter));
    });
  };
  const [allRows, setRows] = useState(initialRows);
  const rows = useMemo(
    () => allRows.filter((r) => (!circleFilter || r.circleId === circleFilter) && (!groupFilter || r.groupId === groupFilter)),
    [allRows, circleFilter, groupFilter]
  );
  // مفاتيح الطلاب الذين لهم طلب حفظ لم ينتهِ بعد — تُستخدم فقط لمؤشر بصري خفيف،
  // ولا تعطّل أي زر أبداً حتى لا يشعر المشرف بتعليق أثناء الضغط المتكرر السريع.
  const [saving, setSaving] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [pointsSettingsOpen, setPointsSettingsOpen] = useState(false);
  const [historyFor, setHistoryFor] = useState<Row | null>(null);
  const [nameQuery, setNameQuery] = useState("");
  const lastLocalChange = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    setRows(initialRows);
  }, [initialRows]);

  const stats = useMemo(() => {
    const s = { present: 0, absent: 0, late: 0, excused: 0, unmarked: 0 };
    for (const r of rows) {
      if (r.status) s[r.status]++;
      else s.unmarked++;
    }
    return s;
  }, [rows]);

  const filteredRows = useMemo(() => {
    const q = nameQuery.trim();
    if (!q) return rows;
    return rows.filter((r) => r.fullName.includes(q) || r.code.includes(q));
  }, [rows, nameQuery]);

  const setStatus = (studentId: string, status: Exclude<Status, null>) => {
    if (!selectedDay || selectedDay.is_holiday) return;
    lastLocalChange.current.set(studentId, Date.now());
    setRows((prev) => prev.map((r) => (r.studentId === studentId ? { ...r, status } : r)));
    setSaving((prev) => new Set(prev).add(studentId));
    setAttendanceAction(studentId, selectedDay.id, status).finally(() => {
      setSaving((prev) => {
        const next = new Set(prev);
        next.delete(studentId);
        return next;
      });
    });
  };

  const markAllPresent = () => {
    if (!selectedDay || selectedDay.is_holiday) return;
    const unmarkedIds = rows.filter((r) => !r.status).map((r) => r.studentId);
    if (unmarkedIds.length === 0) return;
    for (const id of unmarkedIds) lastLocalChange.current.set(id, Date.now());
    const idSet = new Set(unmarkedIds);
    setRows((prev) => prev.map((r) => (idSet.has(r.studentId) ? { ...r, status: "present" } : r)));
    startTransition(async () => {
      await bulkMarkPresentAction(unmarkedIds, selectedDay.id);
    });
  };

  // مزامنة فورية بين الأجهزة: أي تعليم حضور يسجّله مشرف آخر على نفس اليوم يظهر هنا مباشرة
  // بدون تحديث الصفحة، عبر Supabase Realtime على جدول attendance_records.
  useEffect(() => {
    if (!selectedDay) return;
    const supabase = createClient();
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    (async () => {
      // يجب تمرير جلسة المستخدم إلى عميل Realtime صراحةً قبل الاشتراك، وإلا فسيتم تقييم
      // سياسات RLS كزائر مجهول (anon) وترفض بث تغييرات attendance_records.
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (cancelled) return;
      if (session) supabase.realtime.setAuth(session.access_token);

      channel = supabase
        // اسم فريد لكل تشغيل لهذا الـ effect: تفادي تعارض React StrictMode الذي يعيد
        // استخدام قناة سابقة لم يكتمل إلغاء اشتراكها بعد ويرفض إضافة مستمع جديد إليها.
        .channel(`attendance-day-${selectedDay.id}-${crypto.randomUUID()}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "attendance_records", filter: `program_day_id=eq.${selectedDay.id}` },
          (payload) => {
            const record = (payload.new ?? payload.old) as { student_id?: string; status?: Status } | null;
            if (!record?.student_id) return;
            // تجاهل الصدى القادم من تعديلنا المحلي نفسه خلال آخر 4 ثوانٍ لتفادي أي وميض
            const justChangedLocally = Date.now() - (lastLocalChange.current.get(record.student_id) ?? 0) < 4000;
            if (justChangedLocally) return;
            setRows((prev) =>
              prev.map((r) => (r.studentId === record.student_id ? { ...r, status: record.status ?? r.status } : r))
            );
          }
        )
        .subscribe((status) => {
          if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            // eslint-disable-next-line no-console
            console.error("[attendance realtime] فشل الاشتراك:", status);
          }
        });
    })();

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [selectedDay]);

  const dayLabel = selectedDay
    ? new Date(selectedDay.day_date).toLocaleDateString("ar-SA", { weekday: "long", day: "numeric", month: "long" })
    : "—";

  return (
    <main className="p-(--space-4) md:p-(--space-8) max-w-[1100px] mx-auto pb-24">
      <div className="flex items-center justify-between flex-wrap gap-(--space-3) mb-(--space-6)">
        <div>
          <h1 className="text-[22px] leading-[30px] font-bold text-ink">كشف الحضور</h1>
          <p className="text-sm text-ink-muted mt-1">
            {seasonName} · {dayLabel}
          </p>
        </div>
        <div className="flex items-center gap-(--space-2)">
          <Button variant="outline" onClick={() => setPointsSettingsOpen(true)}>
            <Settings2 size={16} /> النقاط التلقائية
          </Button>
          <Button onClick={() => setSummaryOpen(true)}>
            <ListChecks size={16} /> إنهاء اليوم
          </Button>
        </div>
      </div>

      <div className="mb-(--space-4)">
        <Card className="flex flex-wrap gap-(--space-3) items-end">
          <div>
            <label className="block text-[12px] font-semibold text-ink-muted mb-1">اليوم</label>
            <select
              name="day"
              value={selectedDay?.id ?? ""}
              onChange={(e) => changeDay(e.target.value)}
              className="h-11 rounded-(--radius-sm) border border-line bg-surface-raised px-(--space-3) text-sm text-ink"
            >
              {programDays.map((d) => (
                <option key={d.id} value={d.id}>
                  {new Date(d.day_date).toLocaleDateString("ar-SA", { weekday: "short", day: "numeric", month: "short" })}
                  {d.is_holiday ? " — عطلة" : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-ink-muted mb-1">الحلقة</label>
            <select
              name="circle"
              value={circleFilter}
              onChange={(e) => applyLocalFilter(e.target.value, groupFilter)}
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
              value={groupFilter}
              onChange={(e) => applyLocalFilter(circleFilter, e.target.value)}
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
          <Button type="button" variant="outline" onClick={markAllPresent} disabled={!selectedDay || selectedDay.is_holiday}>
            تعليم الجميع حاضر
          </Button>
        </Card>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-(--space-2) mb-(--space-4)">
        <StatChip label="حاضر" count={stats.present} tone="success" />
        <StatChip label="متأخر" count={stats.late} tone="warning" />
        <StatChip label="بعذر" count={stats.excused} tone="info" />
        <StatChip label="غائب" count={stats.absent} tone="danger" />
        <StatChip label="غير مسجّل" count={stats.unmarked} tone="neutral" />
      </div>

      <div className="relative mb-(--space-4)">
        <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint" />
        <input
          value={nameQuery}
          onChange={(e) => setNameQuery(e.target.value)}
          placeholder="ابحث باسم الطالب أو كوده..."
          className="w-full h-11 rounded-(--radius-sm) border border-line bg-surface-raised pr-9 pl-3 text-sm text-ink placeholder:text-ink-faint"
        />
      </div>

      {nameQuery.trim() && filteredRows.length === 0 && (
        <Card className="mb-(--space-4)">
          <CardDescription>لا يوجد طالب مطابق لبحثك.</CardDescription>
        </Card>
      )}

      {!selectedDay && (
        <Card className="mb-(--space-4) border-warning bg-warning-soft">
          <CardDescription className="text-warning font-semibold">لا توجد أيام برنامج لهذا الموسم بعد.</CardDescription>
        </Card>
      )}

      {selectedDay?.is_holiday && (
        <Card className="mb-(--space-4) border-danger bg-danger-soft">
          <CardDescription className="text-danger font-semibold">
            هذا اليوم عطلة{selectedDay.note ? ` — ${selectedDay.note}` : ""}. لا يمكن تسجيل حضور فيه.
          </CardDescription>
        </Card>
      )}

      {dayPending && (
        <div className="flex items-center justify-center mb-(--space-3)">
          <LottieLoader size={64} label="جارِ تحميل اليوم..." />
        </div>
      )}

      {/* جدول للشاشات الكبيرة */}
      <div className={`hidden md:block rounded-(--radius-md) border border-line overflow-hidden ${dayPending ? "opacity-50 pointer-events-none" : ""}`}>
        <table className="w-full text-sm">
          <thead className="bg-surface-sunken">
            <tr>
              <th className="p-(--space-3) text-right font-semibold text-ink-muted">الطالب</th>
              <th className="p-(--space-3) text-right font-semibold text-ink-muted">الحلقة</th>
              <th className="p-(--space-3) text-center font-semibold text-ink-muted" colSpan={4}>
                الحالة
              </th>
              <th className="p-(--space-3)"></th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((r) => (
              <tr key={r.studentId} className="border-t border-line bg-surface-raised">
                <td className="p-(--space-3)">
                  <span className="font-semibold text-ink">{r.fullName}</span> <Badge tone="neutral">#{r.code}</Badge>
                  {saving.has(r.studentId) && (
                    <span
                      className="inline-block h-3 w-3 rounded-full border-2 border-brand-soft border-t-brand animate-spin mr-1 align-middle"
                      title="جارِ الحفظ"
                    />
                  )}
                </td>
                <td className="p-(--space-3) text-ink-muted">
                  {r.circleName ?? "—"} {r.groupName ? `· ${r.groupName}` : ""}
                </td>
                <td className="p-(--space-2)" colSpan={4}>
                  <div className="flex items-center justify-center gap-(--space-2)">
                    {(Object.keys(STATUS_META) as Exclude<Status, null>[]).map((key) => {
                      const meta = STATUS_META[key];
                      const Icon = meta.icon;
                      const active = r.status === key;
                      return (
                        <button
                          key={key}
                          disabled={!selectedDay || selectedDay.is_holiday}
                          onClick={() => setStatus(r.studentId, key)}
                          title={meta.label}
                          className="h-10 w-10 rounded-(--radius-sm) border-bold flex items-center justify-center transition-colors"
                          style={
                            active
                              ? {
                                  backgroundColor: `var(--color-${meta.tone})`,
                                  color: `var(--color-on-${meta.tone})`,
                                  borderColor: "var(--color-line-strong)",
                                }
                              : { borderColor: "var(--color-line)", color: "var(--color-ink-faint)" }
                          }
                        >
                          <Icon size={17} />
                        </button>
                      );
                    })}
                  </div>
                </td>
                <td className="p-(--space-2)">
                  <button
                    onClick={() => setHistoryFor(r)}
                    title="مسيرة الحضور هذا الموسم"
                    className="flex h-9 w-9 items-center justify-center rounded-(--radius-sm) text-ink-muted hover:bg-surface-sunken hover:text-brand"
                  >
                    <History size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* بطاقات للجوال */}
      <div className={`md:hidden space-y-(--space-3) ${dayPending ? "opacity-50 pointer-events-none" : ""}`}>
        {filteredRows.map((r) => (
          <Card key={r.studentId}>
            <div className="flex items-center justify-between mb-(--space-3)">
              <div>
                <div className="flex items-center gap-(--space-2)">
                  <span className="font-semibold text-ink text-sm">{r.fullName}</span>
                  <Badge tone="neutral">#{r.code}</Badge>
                  {saving.has(r.studentId) && (
                    <span
                      className="inline-block h-3 w-3 rounded-full border-2 border-brand-soft border-t-brand animate-spin"
                      title="جارِ الحفظ"
                    />
                  )}
                </div>
                <p className="text-[12px] text-ink-muted mt-0.5">
                  {r.circleName ?? "—"} {r.groupName ? `· ${r.groupName}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-(--space-2)">
                {r.status ? (
                  <Badge tone={STATUS_META[r.status].tone as never}>{STATUS_META[r.status].label}</Badge>
                ) : (
                  <Badge tone="neutral">
                    <Circle size={10} /> غير مسجّل
                  </Badge>
                )}
                <button
                  onClick={() => setHistoryFor(r)}
                  className="flex h-8 w-8 items-center justify-center rounded-(--radius-sm) text-ink-muted hover:bg-surface-sunken hover:text-brand"
                >
                  <History size={15} />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-(--space-2)">
              {(Object.keys(STATUS_META) as Exclude<Status, null>[]).map((key) => {
                const meta = STATUS_META[key];
                const Icon = meta.icon;
                const active = r.status === key;
                return (
                  <button
                    key={key}
                    disabled={!selectedDay || selectedDay.is_holiday}
                    onClick={() => setStatus(r.studentId, key)}
                    className="min-h-[48px] rounded-(--radius-sm) border-bold flex flex-col items-center justify-center gap-0.5 text-[11px] font-bold transition-colors"
                    style={
                      active
                        ? {
                            backgroundColor: `var(--color-${meta.tone})`,
                            color: `var(--color-on-${meta.tone})`,
                            borderColor: "var(--color-line-strong)",
                          }
                        : { borderColor: "var(--color-line-strong)", color: "var(--color-ink)" }
                    }
                  >
                    <Icon size={16} />
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </Card>
        ))}
      </div>

      {summaryOpen && (
        <EndDayModal
          rows={rows}
          seasonId={seasonId}
          dayId={selectedDay?.id ?? null}
          onClose={() => setSummaryOpen(false)}
          programInfo={programInfo}
          absentTemplate={absentTemplate}
          lateTemplate={lateTemplate}
          dayLabel={dayLabel}
        />
      )}

      {historyFor && (
        <AttendanceHistoryModal seasonId={seasonId} row={historyFor} onClose={() => setHistoryFor(null)} />
      )}

      {pointsSettingsOpen && <AutoPointsSettingsModal seasonId={seasonId} onClose={() => setPointsSettingsOpen(false)} />}
    </main>
  );
}

function AutoPointsSettingsModal({ seasonId, onClose }: { seasonId: string; onClose: () => void }) {
  const [settings, setSettings] = useState<AutoPointsSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getAutoPointsSettingsAction(seasonId).then(setSettings);
  }, [seasonId]);

  const save = async () => {
    if (!settings) return;
    setSaving(true);
    setSaved(false);
    await saveAutoPointsSettingsAction(seasonId, settings);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  return (
    <Modal title="النقاط التلقائية للحضور" onClose={onClose} maxWidth="480px">
      {!settings ? (
        <div className="flex items-center justify-center py-(--space-8)">
          <LottieLoader size={72} />
        </div>
      ) : (
        <div className="space-y-(--space-4)">
          <label className="flex items-center justify-between rounded-(--radius-sm) border-bold border-line-strong px-(--space-4) py-(--space-3) cursor-pointer">
            <span className="text-sm font-bold text-ink">تفعيل منح النقاط تلقائياً عند تسجيل الحضور</span>
            <input
              type="checkbox"
              checked={settings.isEnabled}
              onChange={(e) => setSettings({ ...settings, isEnabled: e.target.checked })}
              className="h-6 w-6 accent-[var(--color-brand)]"
            />
          </label>

          <div
            className={`grid grid-cols-2 gap-(--space-3) transition-opacity ${
              settings.isEnabled ? "opacity-100" : "opacity-40 pointer-events-none"
            }`}
          >
            <div>
              <Label htmlFor="pts_present">حاضر</Label>
              <Input
                id="pts_present"
                type="number"
                value={settings.pointsPresent}
                onChange={(e) => setSettings({ ...settings, pointsPresent: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label htmlFor="pts_late">متأخر</Label>
              <Input
                id="pts_late"
                type="number"
                value={settings.pointsLate}
                onChange={(e) => setSettings({ ...settings, pointsLate: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label htmlFor="pts_excused">بعذر</Label>
              <Input
                id="pts_excused"
                type="number"
                value={settings.pointsExcused}
                onChange={(e) => setSettings({ ...settings, pointsExcused: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label htmlFor="pts_absent">غائب</Label>
              <Input
                id="pts_absent"
                type="number"
                value={settings.pointsAbsent}
                onChange={(e) => setSettings({ ...settings, pointsAbsent: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-(--radius-sm) bg-info-soft px-(--space-3) py-(--space-3) text-[12px] text-ink-muted leading-relaxed">
            <Info size={14} className="text-info shrink-0 mt-0.5" />
            <p>
              يمكنك استخدام أرقام سالبة (مثل -5) للخصم عند الغياب. النظام آمن تماماً: تغيير حالة الطالب لأي وقت (مثلاً من
              حاضر إلى غائب) يستبدل نقاط الحضور التلقائية بالكامل بدل أن يضيف أو يطرح فوقها، فلا يمكن أن يتكرر أو يتراكم
              الاحتساب مهما بدّلت الحالة. تغيير القيم هنا يُطبَّق على أي تسجيل جديد أو تعديل لاحق فقط، ولا يُعيد حساب
              الأيام السابقة تلقائياً.
            </p>
          </div>

          <div className="flex justify-end gap-(--space-2)">
            <Button type="button" variant="ghost" onClick={onClose}>
              إغلاق
            </Button>
            <Button type="button" onClick={save} disabled={saving}>
              <Trophy size={14} /> {saving ? "جارِ الحفظ..." : saved ? "تم الحفظ ✓" : "حفظ"}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

function AttendanceHistoryModal({
  seasonId,
  row,
  onClose,
}: {
  seasonId: string;
  row: Row;
  onClose: () => void;
}) {
  const [entries, setEntries] = useState<AttendanceHistoryEntry[] | null>(null);

  useEffect(() => {
    getStudentAttendanceHistoryAction(row.studentId, seasonId).then(setEntries);
  }, [row.studentId, seasonId]);

  return (
    <Modal title={`مسيرة الحضور — ${row.fullName}`} onClose={onClose} maxWidth="480px">
      {!entries ? (
        <p className="text-sm text-ink-muted">جارِ التحميل...</p>
      ) : entries.length === 0 ? (
        <p className="text-sm text-ink-muted">لا توجد أيام برنامج بعد هذا الموسم.</p>
      ) : (
        <div className="space-y-(--space-2) max-h-[420px] overflow-y-auto">
          {entries.map((e) => {
            const meta = e.status ? STATUS_META[e.status] : null;
            const Icon = meta?.icon ?? Circle;
            return (
              <div
                key={e.dayDate}
                className="flex items-center justify-between rounded-(--radius-sm) border border-line px-(--space-3) py-(--space-2)"
              >
                <span className="text-sm font-semibold text-ink">
                  {new Date(e.dayDate).toLocaleDateString("ar-SA", { weekday: "long", day: "numeric", month: "long" })}
                </span>
                {meta ? (
                  <Badge tone={meta.tone as never}>
                    <Icon size={11} /> {meta.label}
                  </Badge>
                ) : (
                  <Badge tone="neutral">لم يُسجَّل</Badge>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
}

function StatChip({ label, count, tone }: { label: string; count: number; tone: string }) {
  return (
    <div
      className="rounded-(--radius-sm) border-bold border-line-strong px-(--space-3) py-(--space-2) text-center"
      style={{ backgroundColor: tone === "neutral" ? "var(--color-neutral-soft)" : `var(--color-${tone}-soft)` }}
    >
      <p className="text-[20px] font-bold" style={{ color: tone === "neutral" ? "var(--color-ink-muted)" : `var(--color-${tone})` }}>
        {count}
      </p>
      <p className="text-[11px] font-semibold text-ink-muted">{label}</p>
    </div>
  );
}

function EndDayModal({
  rows,
  seasonId,
  dayId,
  onClose,
  programInfo,
  absentTemplate,
  lateTemplate,
  dayLabel,
}: {
  rows: Row[];
  seasonId: string;
  dayId: string | null;
  onClose: () => void;
  programInfo: ProgramInfo;
  absentTemplate: string;
  lateTemplate: string;
  dayLabel: string;
}) {
  const absentRows = rows.filter((r) => r.status === "absent");
  const lateRows = rows.filter((r) => r.status === "late");
  const [printOpen, setPrintOpen] = useState(false);
  const [sent, setSent] = useState<Set<string>>(new Set());
  const [autoSendState, setAutoSendState] = useState<"idle" | "sending" | "fallback" | "done">("idle");
  const [autoFailed, setAutoFailed] = useState<{ studentId: string; error: string }[]>([]);

  const buildMessage = (r: Row, template: string) =>
    fillTemplate(template, {
      name: r.fullName,
      program: programInfo.program_name,
      mosque: programInfo.mosque_name,
      date: new Date().toLocaleDateString("ar-SA"),
      day: dayLabel,
      circle: r.circleName ?? "",
    } as WhatsappVariables);

  const targets = [...absentRows, ...lateRows];

  const handleAutoSend = async () => {
    setAutoSendState("sending");
    const items = targets.map((r) => ({
      studentId: r.studentId,
      phone: r.guardianPhone,
      message: buildMessage(r, r.status === "absent" ? absentTemplate : lateTemplate),
    }));
    const result = await bulkSendWhatsappAction(items);
    if (result.fallback) {
      setAutoSendState("fallback");
      return;
    }
    setSent(new Set(result.sent));
    setAutoFailed(result.failed);
    setAutoSendState("done");
  };

  return (
    <Modal title="ملخص إنهاء اليوم" onClose={onClose} maxWidth="600px">
      <div className="space-y-(--space-4)">
        <div className="grid grid-cols-2 gap-(--space-3)">
          <div className="rounded-(--radius-sm) bg-danger-soft p-(--space-3) text-center">
            <p className="text-[24px] font-bold text-danger">{absentRows.length}</p>
            <p className="text-[12px] font-semibold text-danger">غائب</p>
          </div>
          <div className="rounded-(--radius-sm) bg-warning-soft p-(--space-3) text-center">
            <p className="text-[24px] font-bold text-warning">{lateRows.length}</p>
            <p className="text-[12px] font-semibold text-warning">متأخر</p>
          </div>
        </div>

        {targets.length === 0 ? (
          <CardDescription>لا يوجد غياب أو تأخر لإرسال إشعارات بشأنه اليوم.</CardDescription>
        ) : (
          <div>
            {autoSendState === "idle" && (
              <Button size="sm" className="w-full mb-(--space-3)" onClick={handleAutoSend}>
                <Send size={14} /> محاولة الإرسال التلقائي عبر WhatsApp Cloud API
              </Button>
            )}
            {autoSendState === "sending" && (
              <div className="flex items-center justify-center gap-2 mb-(--space-3) text-sm font-semibold text-ink-muted">
                <Loader2 size={16} className="animate-spin" /> جارِ الإرسال...
              </div>
            )}
            {autoSendState === "fallback" && (
              <p className="text-[12px] text-warning font-semibold mb-(--space-3) bg-warning-soft rounded-(--radius-sm) px-(--space-3) py-(--space-2)">
                Cloud API غير مفعّل أو غير مهيّأ — استخدم الروابط اليدوية أدناه (واحداً تلو الآخر).
              </p>
            )}
            {autoSendState === "done" && (
              <p className="text-[12px] text-brand font-semibold mb-(--space-3) bg-brand-soft rounded-(--radius-sm) px-(--space-3) py-(--space-2)">
                تم إرسال {sent.size} رسالة تلقائياً{autoFailed.length > 0 ? ` — فشل ${autoFailed.length}` : ""}.
              </p>
            )}

            <p className="text-[13px] font-bold text-ink mb-(--space-2)">
              إرسال يدوي (يُفتح رابط لكل ولي أمر — واحد تلو الآخر)
            </p>
            <div className="space-y-(--space-2) max-h-[300px] overflow-y-auto">
              {targets.map((r) => {
                const template = r.status === "absent" ? absentTemplate : lateTemplate;
                const isSent = sent.has(r.studentId);
                return (
                  <div
                    key={r.studentId}
                    className="flex items-center justify-between rounded-(--radius-sm) border border-line px-(--space-3) py-(--space-2)"
                  >
                    <div>
                      <p className="text-sm font-semibold text-ink">{r.fullName}</p>
                      <Badge tone={r.status === "absent" ? "danger" : "warning"}>
                        {r.status === "absent" ? "غائب" : "متأخر"}
                      </Badge>
                    </div>
                    <a
                      href={buildWaMeLink(r.guardianPhone, buildMessage(r, template))}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setSent((prev) => new Set(prev).add(r.studentId))}
                      className="flex items-center gap-1 h-9 px-3 rounded-(--radius-sm) border-bold border-line-strong text-sm font-semibold"
                      style={
                        isSent
                          ? { backgroundColor: "var(--color-brand-soft)", color: "var(--color-brand-hover)" }
                          : { color: "var(--color-brand)" }
                      }
                    >
                      <MessageCircle size={14} /> {isSent ? "أُرسل" : "إرسال"}
                    </a>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-(--space-2)">
          <Button variant="outline" onClick={() => setPrintOpen(true)} disabled={!dayId}>
            <Printer size={16} /> طباعة حضور اليوم
          </Button>
          <Button onClick={onClose}>تم</Button>
        </div>
      </div>
      {printOpen && dayId && <PrintAttendanceModal seasonId={seasonId} dayId={dayId} dayLabel={dayLabel} onClose={() => setPrintOpen(false)} />}
    </Modal>
  );
}

function PrintAttendanceModal({
  seasonId,
  dayId,
  dayLabel,
  onClose,
}: {
  seasonId: string;
  dayId: string;
  dayLabel: string;
  onClose: () => void;
}) {
  const [circles, setCircles] = useState<AttendancePrintCircle[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    getAttendancePrintCirclesAction(seasonId).then(setCircles);
  }, [seasonId]);

  const download = async (c: AttendancePrintCircle) => {
    const key = c.circleId ?? "none";
    setBusy(key);
    try {
      const res = await fetch(`/api/print/attendance?dayId=${dayId}&circleId=${key}`);
      if (!res.ok) throw new Error("failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `حضور_${c.circleName}_${dayLabel}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      window.alert(`تعذّر إنشاء ملف حلقة ${c.circleName}`);
    }
    setBusy(null);
  };

  const downloadAll = async () => {
    for (const c of circles ?? []) await download(c);
  };

  return (
    <div className="fixed inset-0 z-[60] bg-ink/60 flex items-center justify-center p-(--space-4)" onClick={onClose}>
      <div
        className="bg-surface-raised rounded-(--radius-lg) border-bold border-line-strong max-w-[560px] w-full max-h-[85vh] overflow-y-auto p-(--space-6)"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-(--space-4)">
          <div>
            <p className="text-[16px] font-bold text-ink">طباعة حضور اليوم</p>
            <CardDescription>{dayLabel} — ملف PDF (A4) منفصل لكل حلقة</CardDescription>
          </div>
          <Button size="sm" variant="outline" onClick={onClose}>
            <X size={14} />
          </Button>
        </div>
        {!circles ? (
          <div className="flex items-center justify-center py-(--space-8)">
            <LottieLoader size={80} label="جارِ التحميل..." />
          </div>
        ) : circles.length === 0 ? (
          <p className="text-sm text-ink-muted text-center py-(--space-8)">لا توجد حلقات.</p>
        ) : (
          <>
            <div className="flex justify-end mb-(--space-3)">
              <Button size="sm" onClick={downloadAll} disabled={busy !== null}>
                <Download size={14} /> تحميل كل الملفات
              </Button>
            </div>
            <div className="space-y-(--space-2)">
              {circles.map((c) => (
                <div key={c.circleId ?? "none"} className="flex items-center justify-between rounded-(--radius-sm) border border-line px-(--space-3) py-(--space-2)">
                  <div>
                    <p className="text-sm font-bold text-ink">{c.circleName}</p>
                    <p className="text-[12px] text-ink-muted">{c.count} طالب</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => download(c)} disabled={busy !== null}>
                    {busy === (c.circleId ?? "none") ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />} تحميل PDF
                  </Button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
