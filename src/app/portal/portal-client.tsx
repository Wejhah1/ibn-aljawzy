"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { parentLogoutAction, sendParentNoteAction, deleteParentNoteAction } from "./actions";
import { PushNotificationToggleCompact } from "@/components/push-notification-toggle";
import { GroupTag, SessionTag } from "@/components/ui/tags";
import { hijriDateTime, hijriDay, hijriWeekday } from "@/lib/date";
import { Trophy, LogOut, Send, Trash2, Video, ExternalLink } from "lucide-react";

interface ParentNote {
  id: string;
  sender: string;
  message: string;
  createdAt: string;
}

interface StudentData {
  id: string;
  code: string;
  fullName: string;
  status: string;
  circleName: string | null;
  groupName: string | null;
  circleColor: string | null;
  groupColor: string | null;
  meetingUrl: string | null;
  totalPoints: number;
  attendance: { present: number; late: number; absent: number; excused: number };
  attendanceRate: number | null;
  recentDays: { date: string; status: DayStatus }[];
  achievements: { name: string; icon: string | null }[];
  badges: { name: string; icon: string | null }[];
  monthlyResults: { periodLabel: string; percentage: number | null; statusText: string | null }[];
  notes: ParentNote[];
}

type DayStatus = "present" | "late" | "excused" | "absent" | null;

const STATUS_TONES: { key: Exclude<DayStatus, null>; label: string; tone: string }[] = [
  { key: "present", label: "حاضر", tone: "success" },
  { key: "late", label: "متأخر", tone: "warning" },
  { key: "excused", label: "بعذر", tone: "info" },
  { key: "absent", label: "غائب", tone: "danger" },
];

function rateLabel(rate: number) {
  if (rate >= 90) return { text: "ممتاز", tone: "success" as const };
  if (rate >= 75) return { text: "جيد جداً", tone: "info" as const };
  if (rate >= 60) return { text: "جيد", tone: "warning" as const };
  return { text: "يحتاج متابعة", tone: "danger" as const };
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <CardTitle className="text-center mb-(--space-4)">{children}</CardTitle>;
}

export function PortalClient({ students, seasonName }: { students: StudentData[]; seasonName: string | null }) {
  const [selectedId, setSelectedId] = useState(students[0]?.id);
  const selected = students.find((s) => s.id === selectedId) ?? students[0];

  return (
    <main className="min-h-screen bg-surface">
      <header className="border-b border-line bg-surface-raised">
        <div className="max-w-[800px] mx-auto px-(--space-4) min-h-16 py-(--space-2) flex items-center justify-between">
          <div className="flex items-center gap-(--space-2)">
            <div className="flex h-9 w-9 items-center justify-center rounded-(--radius-sm) bg-surface-raised border-bold border-line-strong overflow-hidden p-0.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.svg" alt="شعار حلقات ابن الجوزي" className="h-full w-full object-contain" />
            </div>
            <p className="text-sm font-bold text-ink">بوابة ولي الأمر</p>
          </div>
          <div className="flex items-center gap-(--space-3)">
            <PushNotificationToggleCompact />
            <form action={parentLogoutAction}>
              <button type="submit" className="flex items-center gap-1 text-[13px] font-semibold text-ink-muted hover:text-danger">
                <LogOut size={14} /> خروج
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="max-w-[800px] mx-auto p-(--space-4) md:p-(--space-8) flex flex-col gap-(--space-5)">
        {students.length > 1 && (
          <div className="flex items-center justify-center gap-(--space-2) overflow-x-auto pb-1">
            {students.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedId(s.id)}
                className={`h-11 px-(--space-4) rounded-(--radius-sm) border-bold text-sm font-bold whitespace-nowrap transition-colors ${
                  selectedId === s.id
                    ? "bg-brand text-on-brand border-line-strong shadow-brutal-sm"
                    : "bg-surface-raised text-ink-muted border-line-strong"
                }`}
              >
                {s.fullName}
              </button>
            ))}
          </div>
        )}

        {!selected ? (
          <Card>
            <CardDescription>لا توجد بيانات لعرضها.</CardDescription>
          </Card>
        ) : (
          <>
            {selected.meetingUrl && (
              <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                <Card className="border-warning bg-warning-soft shadow-brutal-sm text-center">
                  <div className="flex items-center justify-center gap-2 text-warning mb-1">
                    <Video size={20} />
                    <CardTitle className="text-warning">الدراسة اليوم عن بعد</CardTitle>
                  </div>
                  <CardDescription>
                    {selected.circleName ? `رابط ${selected.circleName}` : "رابط الحلقة"}، اضغط للدخول عبر Google Meet
                  </CardDescription>
                  <a
                    href={selected.meetingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-(--space-4) inline-flex items-center justify-center gap-2 h-12 px-(--space-6) rounded-(--radius-sm) bg-brand text-on-brand text-base font-bold border-bold border-line-strong shadow-brutal-sm hover:bg-brand-hover active:shadow-brutal-press active:translate-x-[1px] active:translate-y-[1px]"
                  >
                    <ExternalLink size={18} /> دخول الحلقة الافتراضية
                  </a>
                </Card>
              </motion.div>
            )}

            {/* بطاقة الطالب: الاسم ثم الرقم ثم الحلقة والمجموعة ثم النقاط */}
            <Card className="flex flex-col items-center text-center gap-(--space-2) px-(--space-4) py-(--space-6)">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-soft text-brand-hover font-bold text-3xl mb-(--space-1)">
                {selected.fullName.charAt(0)}
              </div>
              <h1 className="text-[22px] leading-[30px] font-bold text-ink text-balance">{selected.fullName}</h1>
              <p className="font-mono text-[13px] font-medium text-ink-muted">#{selected.code}</p>
              {(selected.circleName || selected.groupName) && (
                <div className="flex items-center justify-center flex-wrap gap-(--space-2)">
                  {selected.circleName && <SessionTag name={selected.circleName} />}
                  {selected.groupName && <GroupTag name={selected.groupName} token={selected.groupColor} />}
                </div>
              )}
              {seasonName && <p className="text-[12px] text-ink-faint">{seasonName}</p>}
              <div className="mt-(--space-3) inline-flex items-center gap-2 rounded-(--radius-sm) bg-brand text-on-brand px-(--space-5) py-(--space-2) border-bold border-line-strong shadow-brutal-sm">
                <Trophy size={20} />
                <span className="text-[30px] leading-[38px] font-bold">{selected.totalPoints}</span>
                <span className="text-sm font-semibold">نقطة</span>
              </div>
            </Card>

            <AttendanceCard student={selected} />

            <Card className="px-(--space-4) py-(--space-6)">
              <SectionTitle>الإنجازات والأوسمة</SectionTitle>
              {selected.achievements.length === 0 && selected.badges.length === 0 ? (
                <CardDescription className="text-center">لا توجد إنجازات أو أوسمة حتى الآن.</CardDescription>
              ) : (
                <div className="flex flex-wrap justify-center gap-(--space-4)">
                  {[...selected.achievements, ...selected.badges].map((a, i) => (
                    <div key={i} className="w-[76px] flex flex-col items-center gap-1.5 text-center">
                      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft border-bold border-accent-solid text-[26px]">
                        {a.icon || "🏅"}
                      </span>
                      <span className="text-[12px] leading-[16px] font-semibold text-ink-muted">{a.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card className="px-(--space-4) py-(--space-6)">
              <SectionTitle>النتائج الشهرية</SectionTitle>
              {selected.monthlyResults.length === 0 ? (
                <CardDescription className="text-center">لا توجد نتائج شهرية حتى الآن.</CardDescription>
              ) : (
                <div className="flex flex-col gap-(--space-3)">
                  {selected.monthlyResults.map((m, i) => (
                    <div key={i} className="rounded-(--radius-sm) bg-surface-sunken px-(--space-4) py-(--space-3) flex flex-col gap-(--space-2)">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-ink">{m.periodLabel}</span>
                        <span className="text-sm font-bold text-brand">{m.percentage !== null ? `${m.percentage}%` : m.statusText}</span>
                      </div>
                      {m.percentage !== null && (
                        <div className="h-1.5 rounded-full bg-line overflow-hidden">
                          <div className="h-full rounded-full bg-brand" style={{ width: `${Math.min(100, Math.max(0, m.percentage))}%` }} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card className="px-(--space-4) py-(--space-6)">
              <SectionTitle>ملاحظة للإدارة</SectionTitle>
              <ParentNotesPanel key={selected.id} studentId={selected.id} notes={selected.notes} />
            </Card>
          </>
        )}
      </div>
    </main>
  );
}

function AttendanceCard({ student }: { student: StudentData }) {
  const rate = student.attendanceRate;
  const label = rate !== null ? rateLabel(rate) : null;
  const radius = 52;
  const circumference = 2 * Math.PI * radius;

  return (
    <Card className="flex flex-col items-center text-center gap-(--space-4) px-(--space-4) py-(--space-6)">
      <CardTitle>الحضور</CardTitle>
      <div className="relative h-[124px] w-[124px]">
        <svg viewBox="0 0 124 124" className="h-full w-full -rotate-90" aria-hidden>
          <circle cx="62" cy="62" r={radius} fill="none" stroke="var(--color-neutral-soft)" strokeWidth="11" />
          {rate !== null && (
            <circle
              cx="62"
              cy="62"
              r={radius}
              fill="none"
              stroke="var(--color-brand)"
              strokeWidth="11"
              strokeLinecap="round"
              strokeDasharray={`${(rate / 100) * circumference} ${circumference}`}
            />
          )}
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[28px] font-bold text-ink">
          {rate !== null ? `${rate}%` : "—"}
        </span>
      </div>
      {label ? <Badge tone={label.tone}>{label.text}</Badge> : <CardDescription>لم يُسجَّل حضور بعد.</CardDescription>}

      {student.recentDays.length > 0 && (
        <div className="flex flex-col items-center gap-(--space-3)">
          <p className="text-[12px] font-semibold text-ink-muted">آخر {student.recentDays.length} يوماً دراسياً</p>
          <div className="grid grid-cols-7 gap-(--space-2)" dir="rtl">
            {student.recentDays.map((d, i) => {
              const tone = STATUS_TONES.find((t) => t.key === d.status);
              const isLast = i === student.recentDays.length - 1;
              return (
                <span
                  key={d.date}
                  title={`${hijriWeekday(d.date)}: ${tone?.label ?? "لم يُسجَّل"}`}
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-[12px] font-bold ${
                    tone ? "text-on-brand" : "bg-neutral-soft text-ink-faint"
                  } ${isLast ? "outline-2 outline-offset-2 outline-line-strong" : ""}`}
                  style={tone ? { backgroundColor: `var(--color-${tone.tone})` } : undefined}
                >
                  {hijriDay(d.date)}
                </span>
              );
            })}
          </div>
          <div className="flex flex-wrap justify-center gap-x-(--space-3) gap-y-1 text-[12px] text-ink-muted">
            {STATUS_TONES.map((t) => (
              <span key={t.key} className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: `var(--color-${t.tone})` }} />
                {t.label}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="w-full border-t border-line pt-(--space-4)">
        <div className="grid grid-cols-4">
          {STATUS_TONES.map((t) => (
            <div key={t.key}>
              <p className="text-[20px] leading-[28px] font-bold" style={{ color: `var(--color-${t.tone})` }}>
                {student.attendance[t.key]}
              </p>
              <p className="text-[12px] font-semibold text-ink-muted">{t.label}</p>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-ink-faint mt-(--space-2)">مجموع الموسم</p>
      </div>
    </Card>
  );
}

function ParentNotesPanel({ studentId, notes }: { studentId: string; notes: ParentNote[] }) {
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [localNotes, setLocalNotes] = useState(notes);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const send = async () => {
    const trimmed = message.trim();
    if (!trimmed) return;
    setPending(true);
    setLocalNotes((prev) => [...prev, { id: `temp-${Date.now()}`, sender: "parent", message: trimmed, createdAt: new Date().toISOString() }]);
    setMessage("");
    await sendParentNoteAction(studentId, trimmed);
    setPending(false);
  };

  const remove = async (noteId: string) => {
    setDeletingId(noteId);
    const result = await deleteParentNoteAction(studentId, noteId);
    if (!result?.error) setLocalNotes((prev) => prev.filter((n) => n.id !== noteId));
    setDeletingId(null);
  };

  return (
    <div>
      {localNotes.length > 0 && (
        <div className="space-y-(--space-3) mb-(--space-4) max-h-[320px] overflow-y-auto">
          {localNotes.map((n) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
              className={`rounded-(--radius-sm) px-(--space-3) py-(--space-2) max-w-[85%] ${
                n.sender === "admin" ? "bg-brand-soft mr-auto" : "bg-surface-sunken ml-auto"
              }`}
            >
              <p className="text-sm text-ink text-right">{n.message}</p>
              <div className="flex items-center justify-between gap-(--space-2) mt-1">
                {n.sender === "parent" && !n.id.startsWith("temp-") ? (
                  <button
                    onClick={() => remove(n.id)}
                    disabled={deletingId === n.id}
                    title="حذف الرسالة"
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-raised border border-danger text-danger shrink-0 active:scale-95 transition-transform disabled:opacity-50"
                  >
                    <Trash2 size={12} />
                  </button>
                ) : (
                  <span />
                )}
                <p className="text-[11px] text-ink-faint text-right">
                  {n.sender === "admin" ? "الإدارة" : "أنت"}، {hijriDateTime(n.createdAt)}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
      <div className="flex gap-(--space-2)">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="اكتب ملاحظتك هنا..."
          className="flex-1"
          onKeyDown={(e) => e.key === "Enter" && send()}
        />
        <Button disabled={!message.trim() || pending} onClick={send}>
          <Send size={14} /> إرسال
        </Button>
      </div>
    </div>
  );
}
