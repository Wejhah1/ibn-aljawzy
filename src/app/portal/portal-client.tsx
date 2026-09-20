"use client";

import { useState } from "react";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { parentLogoutAction, sendParentNoteAction } from "./actions";
import { Trophy, CalendarCheck, Award, ShieldAlert, LogOut, ClipboardList, MessageSquare, Send } from "lucide-react";

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
  totalPoints: number;
  attendance: { present: number; late: number; absent: number; excused: number };
  achievements: { name: string }[];
  badges: { name: string }[];
  monthlyResults: { periodLabel: string; percentage: number }[];
  notes: ParentNote[];
}

export function PortalClient({ students, seasonName }: { students: StudentData[]; seasonName: string | null }) {
  const [selectedId, setSelectedId] = useState(students[0]?.id);
  const selected = students.find((s) => s.id === selectedId) ?? students[0];

  return (
    <main className="min-h-screen bg-surface">
      <header className="border-b border-line bg-surface-raised">
        <div className="max-w-[800px] mx-auto px-(--space-4) h-16 flex items-center justify-between">
          <div className="flex items-center gap-(--space-2)">
            <div className="flex h-9 w-9 items-center justify-center rounded-(--radius-sm) bg-brand text-on-brand border-bold border-line-strong font-bold">
              ا
            </div>
            <p className="text-sm font-bold text-ink">بوابة ولي الأمر</p>
          </div>
          <form action={parentLogoutAction}>
            <button type="submit" className="flex items-center gap-1 text-[13px] font-semibold text-ink-muted hover:text-danger">
              <LogOut size={14} /> خروج
            </button>
          </form>
        </div>
      </header>

      <div className="max-w-[800px] mx-auto p-(--space-4) md:p-(--space-8)">
        {students.length > 1 && (
          <div className="flex items-center gap-(--space-2) mb-(--space-6) overflow-x-auto pb-1">
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
            <Card className="mb-(--space-6) shadow-brutal-sm text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-soft text-brand-hover font-bold text-3xl mx-auto mb-(--space-3)">
                {selected.fullName.charAt(0)}
              </div>
              <h1 className="text-[20px] font-bold text-ink">{selected.fullName}</h1>
              <p className="text-sm text-ink-muted mt-1">
                <Badge tone="neutral">#{selected.code}</Badge>
                {selected.circleName && <span className="mr-2">{selected.circleName}</span>}
                {selected.groupName && <span> · {selected.groupName}</span>}
              </p>
              {seasonName && <p className="text-[12px] text-ink-faint mt-1">{seasonName}</p>}
              <div className="mt-(--space-4) inline-flex items-center gap-2 rounded-(--radius-sm) bg-brand text-on-brand px-(--space-4) py-(--space-2) border-bold border-line-strong shadow-brutal-sm">
                <Trophy size={20} />
                <span className="text-[28px] font-bold">{selected.totalPoints}</span>
                <span className="text-sm font-semibold">نقطة</span>
              </div>
            </Card>

            <Card className="mb-(--space-6)">
              <CardTitle className="mb-(--space-4) flex items-center gap-2">
                <CalendarCheck size={18} className="text-brand" /> الحضور هذا الموسم
              </CardTitle>
              <div className="grid grid-cols-4 gap-(--space-2)">
                <StatBox label="حاضر" value={selected.attendance.present} tone="success" />
                <StatBox label="متأخر" value={selected.attendance.late} tone="warning" />
                <StatBox label="بعذر" value={selected.attendance.excused} tone="info" />
                <StatBox label="غائب" value={selected.attendance.absent} tone="danger" />
              </div>
            </Card>

            {(selected.achievements.length > 0 || selected.badges.length > 0) && (
              <Card className="mb-(--space-6)">
                <CardTitle className="mb-(--space-3) flex items-center gap-2">
                  <Award size={18} className="text-accent" /> الإنجازات والأوسمة
                </CardTitle>
                <div className="flex flex-wrap gap-(--space-2)">
                  {selected.achievements.map((a, i) => (
                    <Badge key={`a-${i}`} tone="accent">
                      <Award size={11} /> {a.name}
                    </Badge>
                  ))}
                  {selected.badges.map((b, i) => (
                    <Badge key={`b-${i}`} tone="accent">
                      <ShieldAlert size={11} /> {b.name}
                    </Badge>
                  ))}
                </div>
              </Card>
            )}

            {selected.monthlyResults.length > 0 && (
              <Card className="mb-(--space-6)">
                <CardTitle className="mb-(--space-3) flex items-center gap-2">
                  <ClipboardList size={18} className="text-info" /> النتائج الشهرية
                </CardTitle>
                <div className="space-y-(--space-2)">
                  {selected.monthlyResults.map((m, i) => (
                    <div key={i} className="flex items-center justify-between rounded-(--radius-sm) bg-surface-sunken px-(--space-3) py-(--space-2)">
                      <span className="text-sm font-semibold text-ink">{m.periodLabel}</span>
                      <span className="text-sm font-bold text-brand">{m.percentage}%</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            <Card>
              <CardTitle className="mb-(--space-3) flex items-center gap-2">
                <MessageSquare size={18} className="text-brand" /> ملاحظة للإدارة
              </CardTitle>
              <ParentNotesPanel studentId={selected.id} notes={selected.notes} />
            </Card>
          </>
        )}
      </div>
    </main>
  );
}

function ParentNotesPanel({ studentId, notes }: { studentId: string; notes: ParentNote[] }) {
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [localNotes, setLocalNotes] = useState(notes);

  const send = async () => {
    const trimmed = message.trim();
    if (!trimmed) return;
    setPending(true);
    setLocalNotes((prev) => [...prev, { id: `temp-${Date.now()}`, sender: "parent", message: trimmed, createdAt: new Date().toISOString() }]);
    setMessage("");
    await sendParentNoteAction(studentId, trimmed);
    setPending(false);
  };

  return (
    <div>
      {localNotes.length > 0 && (
        <div className="space-y-(--space-2) mb-(--space-4) max-h-[280px] overflow-y-auto">
          {localNotes.map((n) => (
            <div
              key={n.id}
              className={`rounded-(--radius-sm) px-(--space-3) py-(--space-2) max-w-[85%] ${
                n.sender === "admin" ? "bg-brand-soft mr-auto" : "bg-surface-sunken ml-auto"
              }`}
            >
              <p className="text-sm text-ink text-right">{n.message}</p>
              <p className="text-[11px] text-ink-faint mt-1 text-right">
                {n.sender === "admin" ? "الإدارة" : "أنت"} · {new Date(n.createdAt).toLocaleString("ar-SA")}
              </p>
            </div>
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

function StatBox({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div
      className="rounded-(--radius-sm) border-bold border-line-strong px-(--space-2) py-(--space-3) text-center"
      style={{ backgroundColor: `var(--color-${tone}-soft)` }}
    >
      <p className="text-[22px] font-bold" style={{ color: `var(--color-${tone})` }}>
        {value}
      </p>
      <p className="text-[11px] font-semibold text-ink-muted">{label}</p>
    </div>
  );
}
