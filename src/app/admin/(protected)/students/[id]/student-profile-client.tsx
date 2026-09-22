"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import {
  updateStudentAction,
  updateEnrollmentAction,
  dropoutStudentAction,
  returnStudentAction,
  awardAchievementAction,
  awardBadgeAction,
  setStudentFlagAction,
  resolveStudentFlagAction,
  sendParentNoteAdminAction,
  deleteParentNoteAdminAction,
  deleteStudentAction,
  type FormState,
} from "../actions";
import {
  ArrowRight,
  Pencil,
  UserX,
  UserCheck,
  Trophy,
  Award,
  CalendarCheck,
  ShieldAlert,
  Flag as FlagIcon,
  CheckCircle2,
  MessageSquare,
  Send,
  Trash2,
  Coins,
  Plus,
  Minus,
} from "lucide-react";

const ID_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "national_id", label: "هوية وطنية" },
  { value: "iqama", label: "إقامة" },
  { value: "passport", label: "جواز سفر" },
];
const ID_TYPE_LABEL: Record<string, string> = Object.fromEntries(ID_TYPE_OPTIONS.map((o) => [o.value, o.label]));

interface Student {
  id: string;
  code: string;
  full_name: string;
  birth_date: string | null;
  national_id: string | null;
  id_type: string;
  nationality: string | null;
  personal_number: string | null;
  guardian_name: string | null;
  guardian_phone: string;
  guardian_relation: string | null;
  address: string | null;
  notes: string | null;
  status: "active" | "dropped_out";
}

interface Enrollment {
  id: string;
  season_id: string;
  circle_id: string | null;
  group_id: string | null;
  status: string;
  total_points: number;
  seasons: { name: string; status: string; start_date: string } | { name: string; status: string; start_date: string }[] | null;
  circles: { name: string } | { name: string }[] | null;
  groups: { name: string } | { name: string }[] | null;
}

interface ParentNote {
  id: string;
  sender: string;
  message: string;
  created_at: string;
  is_read_by_admin: boolean;
}

interface PointTransaction {
  id: string;
  points: number;
  source: string;
  reason: string | null;
  created_at: string;
  season_id: string;
  profiles: { full_name: string } | { full_name: string }[] | null;
}

const SOURCE_LABEL: Record<string, string> = {
  manual: "يدوي",
  auto_attendance: "تلقائي (حضور)",
  achievement: "إنجاز",
};

function one<T>(v: T | T[] | null): T | null {
  if (!v) return null;
  return Array.isArray(v) ? v[0] ?? null : v;
}

export function StudentProfileClient({
  student,
  enrollments,
  attendanceBySeasonStatus,
  achievements,
  badges,
  dropoutPeriods,
  circles,
  groups,
  currentSeason,
  allAchievements,
  allBadges,
  allFlags,
  studentFlags,
  parentNotes,
  pointTransactions,
}: {
  student: Student;
  enrollments: Enrollment[];
  attendanceBySeasonStatus: Record<string, Record<string, number>>;
  achievements: { season_id: string; achievements: { name: string; icon: string | null } | { name: string; icon: string | null }[] | null }[];
  badges: { season_id: string; badges: { name: string; icon: string | null } | { name: string; icon: string | null }[] | null }[];
  dropoutPeriods: { dropped_at: string; returned_at: string | null; reason: string | null }[];
  circles: { id: string; name: string }[];
  groups: { id: string; name: string }[];
  currentSeason: { id: string; name: string } | null;
  allAchievements: { id: string; name: string; points_awarded: number }[];
  allBadges: { id: string; name: string }[];
  allFlags: { id: string; name: string; severity: string }[];
  studentFlags: {
    id: string;
    flag_id: string;
    is_resolved: boolean;
    note: string | null;
    set_at: string;
    flags: { name: string; severity: string } | { name: string; severity: string }[] | null;
  }[];
  parentNotes: ParentNote[];
  pointTransactions: PointTransaction[];
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [dropoutOpen, setDropoutOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const currentEnrollment = enrollments.find((e) => e.season_id === currentSeason?.id);
  const hasUnreadParentNote = parentNotes.some((n) => n.sender === "parent");

  return (
    <main className="p-(--space-4) md:p-(--space-8) max-w-[900px] mx-auto">
      <Link href="/admin/students" className="inline-flex items-center gap-1 text-[13px] font-semibold text-ink-muted hover:text-ink mb-(--space-4)">
        <ArrowRight size={14} /> العودة لقائمة الطلاب
      </Link>

      <Card className="mb-(--space-6) shadow-brutal-sm">
        <div className="flex items-start justify-between flex-wrap gap-(--space-4)">
          <div className="flex items-center gap-(--space-4)">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-soft text-brand-hover font-bold text-2xl shrink-0">
              {student.full_name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-(--space-2) flex-wrap">
                <h1 className="text-[22px] leading-[30px] font-bold text-ink">{student.full_name}</h1>
                <Badge tone="neutral">#{student.code}</Badge>
                {student.status === "dropped_out" ? (
                  <Badge tone="danger">منقطع</Badge>
                ) : (
                  <Badge tone="success">نشط</Badge>
                )}
                {hasUnreadParentNote && (
                  <Badge tone="warning">
                    <MessageSquare size={11} /> ملاحظة من ولي الأمر
                  </Badge>
                )}
              </div>
              <p className="text-sm text-ink-muted mt-1">
                ولي الأمر: {student.guardian_name ?? "—"} ({student.guardian_relation ?? "—"}) · {student.guardian_phone}
              </p>
              <p className="text-[12px] text-ink-faint mt-1">
                {ID_TYPE_LABEL[student.id_type] ?? "هوية"}: {student.national_id ?? "—"}
                {student.nationality ? ` · ${student.nationality}` : ""}
                {student.personal_number ? ` · رقم شخصي: ${student.personal_number}` : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-(--space-2)">
            <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
              <Pencil size={14} /> تعديل
            </Button>
            {student.status === "active" ? (
              <Button size="sm" variant="danger" onClick={() => setDropoutOpen(true)}>
                <UserX size={14} /> منقطع
              </Button>
            ) : (
              <ReturnButton studentId={student.id} />
            )}
            <button
              onClick={() => setDeleteOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-(--radius-sm) text-danger hover:bg-danger-soft"
              title="حذف الطالب نهائياً"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        {student.notes && (
          <div className="mt-(--space-4) pt-(--space-4) border-t border-line">
            <p className="text-[12px] font-semibold text-ink-muted mb-1">ملاحظات</p>
            <p className="text-sm text-ink">{student.notes}</p>
          </div>
        )}
      </Card>

      {currentSeason && (
        <Card className="mb-(--space-6)">
          <CardTitle className="mb-(--space-3)">التسجيل في الموسم الحالي — {currentSeason.name}</CardTitle>
          <EnrollmentEditor
            studentId={student.id}
            seasonId={currentSeason.id}
            enrollment={currentEnrollment ?? null}
            circles={circles}
            groups={groups}
          />
        </Card>
      )}

      {currentSeason && (
        <Card className="mb-(--space-6)">
          <CardTitle className="mb-(--space-3)">منح إنجاز / وسام / علامة</CardTitle>
          <AwardPanel
            studentId={student.id}
            seasonId={currentSeason.id}
            allAchievements={allAchievements}
            allBadges={allBadges}
            allFlags={allFlags}
          />
          {studentFlags.length > 0 && (
            <div className="mt-(--space-4) pt-(--space-4) border-t border-line space-y-(--space-2)">
              {studentFlags.map((sf) => {
                const flag = one(sf.flags);
                return (
                  <div key={sf.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-(--space-2)">
                      <FlagIcon size={14} className={sf.is_resolved ? "text-ink-faint" : "text-warning"} />
                      <span className={`text-sm font-semibold ${sf.is_resolved ? "text-ink-faint line-through" : "text-ink"}`}>
                        {flag?.name}
                      </span>
                      {sf.note && <span className="text-[12px] text-ink-muted">— {sf.note}</span>}
                    </div>
                    {!sf.is_resolved && (
                      <Button size="sm" variant="ghost" onClick={() => resolveStudentFlagAction(sf.id, student.id)}>
                        <CheckCircle2 size={13} /> إغلاق
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      <Card className="mb-(--space-6)">
        <CardTitle className="mb-(--space-3) flex items-center gap-2">
          <MessageSquare size={16} className="text-brand" /> التواصل مع ولي الأمر
        </CardTitle>
        <ParentNotesThread studentId={student.id} notes={parentNotes} />
      </Card>

      <div>
        <h2 className="text-[16px] font-bold text-ink mb-(--space-3)">الخط الزمني للمواسم</h2>
        <div className="space-y-(--space-3)">
          {enrollments.length === 0 && (
            <Card>
              <CardDescription>لا يوجد سجل مواسم بعد.</CardDescription>
            </Card>
          )}
          {enrollments.map((e) => {
            const season = one(e.seasons);
            const circle = one(e.circles);
            const group = one(e.groups);
            const att = attendanceBySeasonStatus[e.season_id] ?? {};
            const seasonAchievements = achievements.filter((a) => a.season_id === e.season_id);
            const seasonBadges = badges.filter((b) => b.season_id === e.season_id);
            const seasonPointTransactions = pointTransactions.filter((t) => t.season_id === e.season_id);

            return (
              <Card key={e.id}>
                <div className="flex items-center justify-between flex-wrap gap-(--space-2) mb-(--space-3)">
                  <div className="flex items-center gap-(--space-2)">
                    <CardTitle>{season?.name ?? "—"}</CardTitle>
                    {season?.status === "current" && <Badge tone="success">الحالي</Badge>}
                  </div>
                  <Badge tone="brand">
                    <Trophy size={12} /> {e.total_points} نقطة
                  </Badge>
                </div>
                <CardDescription className="mb-(--space-3)">
                  {circle?.name ?? "بلا حلقة"} {group ? `· ${group.name}` : ""}
                </CardDescription>

                <div className="flex items-center gap-(--space-4) flex-wrap text-[12px] font-semibold">
                  <span className="flex items-center gap-1 text-brand">
                    <CalendarCheck size={13} /> حاضر: {att.present ?? 0}
                  </span>
                  <span className="text-warning">متأخر: {att.late ?? 0}</span>
                  <span className="text-danger">غائب: {att.absent ?? 0}</span>
                  <span className="text-info">بعذر: {att.excused ?? 0}</span>
                </div>

                {(seasonAchievements.length > 0 || seasonBadges.length > 0) && (
                  <div className="mt-(--space-3) pt-(--space-3) border-t border-line flex items-center gap-(--space-2) flex-wrap">
                    {seasonAchievements.map((a, i) => {
                      const ach = one(a.achievements);
                      return (
                        <Badge key={`a-${i}`} tone="accent">
                          <Award size={11} /> {ach?.name}
                        </Badge>
                      );
                    })}
                    {seasonBadges.map((b, i) => {
                      const badge = one(b.badges);
                      return (
                        <Badge key={`b-${i}`} tone="accent">
                          <ShieldAlert size={11} /> {badge?.name}
                        </Badge>
                      );
                    })}
                  </div>
                )}

                <SeasonPointsLog transactions={seasonPointTransactions} />
              </Card>
            );
          })}
        </div>
      </div>

      {dropoutPeriods.length > 0 && (
        <div className="mt-(--space-6)">
          <h2 className="text-[16px] font-bold text-ink mb-(--space-3)">سجل الانقطاع</h2>
          <Card>
            <div className="space-y-(--space-2)">
              {dropoutPeriods.map((d, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-ink">
                    {new Date(d.dropped_at).toLocaleDateString("ar-SA")}
                    {d.returned_at ? ` → ${new Date(d.returned_at).toLocaleDateString("ar-SA")}` : " (لم يعد بعد)"}
                  </span>
                  {d.reason && <span className="text-ink-muted">{d.reason}</span>}
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {editOpen && <EditStudentModal student={student} onClose={() => setEditOpen(false)} />}
      {dropoutOpen && <DropoutModal studentId={student.id} onClose={() => setDropoutOpen(false)} />}
      {deleteOpen && <DeleteStudentModal studentId={student.id} studentName={student.full_name} onClose={() => setDeleteOpen(false)} />}
    </main>
  );
}

function ParentNotesThread({ studentId, notes: initialNotes }: { studentId: string; notes: ParentNote[] }) {
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [notes, setNotes] = useState(initialNotes);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => setNotes(initialNotes), [initialNotes]);

  const deleteNote = async (noteId: string) => {
    setDeletingId(noteId);
    const result = await deleteParentNoteAdminAction(noteId, studentId);
    if (!result?.error) setNotes((prev) => prev.filter((n) => n.id !== noteId));
    setDeletingId(null);
  };

  return (
    <div>
      <div className="space-y-(--space-2) max-h-[320px] overflow-y-auto mb-(--space-4)">
        {notes.length === 0 && <CardDescription>لا توجد رسائل بعد.</CardDescription>}
        {notes.map((n) => (
          <div
            key={n.id}
            className={`rounded-(--radius-sm) px-(--space-3) py-(--space-2) max-w-[85%] ${
              n.sender === "admin" ? "bg-brand-soft mr-auto text-right" : "bg-surface-sunken ml-auto text-right"
            }`}
          >
            <p className="text-sm text-ink">{n.message}</p>
            <div className="flex items-center justify-between gap-(--space-2) mt-1">
              <p className="text-[11px] text-ink-faint">
                {n.sender === "admin" ? "الإدارة" : "ولي الأمر"} · {new Date(n.created_at).toLocaleString("ar-SA")}
              </p>
              {n.sender === "admin" && (
                <button
                  onClick={() => deleteNote(n.id)}
                  disabled={deletingId === n.id}
                  title="حذف الرسالة"
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-raised border border-danger text-danger shrink-0 active:scale-95 transition-transform disabled:opacity-50"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-(--space-2)">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="اكتب رداً لولي الأمر..."
          className="flex-1"
        />
        <Button
          disabled={!message.trim() || pending}
          onClick={async () => {
            setPending(true);
            await sendParentNoteAdminAction(studentId, message.trim());
            setMessage("");
            setPending(false);
          }}
        >
          <Send size={14} /> إرسال
        </Button>
      </div>
    </div>
  );
}

function SeasonPointsLog({ transactions }: { transactions: PointTransaction[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-(--space-3) pt-(--space-3) border-t border-line">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-[12px] font-bold text-ink-muted hover:text-ink"
      >
        <Coins size={13} /> سجل النقاط لهذا الموسم ({transactions.length}) {open ? "▲" : "▼"}
      </button>
      {open && (
        <div className="mt-(--space-3)">
          <PointsLog transactions={transactions} />
        </div>
      )}
    </div>
  );
}

function PointsLog({ transactions }: { transactions: PointTransaction[] }) {
  if (transactions.length === 0) {
    return <CardDescription>لا يوجد سجل نقاط لهذا الموسم بعد.</CardDescription>;
  }

  return (
    <div className="space-y-(--space-2) max-h-[400px] overflow-y-auto">
      {transactions.map((t) => {
        const profile = one(t.profiles);
        const positive = t.points > 0;
        return (
          <div key={t.id} className="flex items-start justify-between gap-(--space-3) py-(--space-2) border-b border-line last:border-b-0">
            <div className="flex items-start gap-(--space-2)">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full shrink-0 mt-0.5 ${
                  positive ? "bg-brand-soft text-brand-hover" : "bg-danger-soft text-danger"
                }`}
              >
                {positive ? <Plus size={13} /> : <Minus size={13} />}
              </span>
              <div>
                <p className="text-sm text-ink">
                  {t.reason || SOURCE_LABEL[t.source] || t.source}
                </p>
                <p className="text-[11px] text-ink-faint">
                  {new Date(t.created_at).toLocaleString("ar-SA")}
                  {profile?.full_name ? ` · ${profile.full_name}` : ""}
                  {t.source !== "manual" ? ` · ${SOURCE_LABEL[t.source] ?? t.source}` : ""}
                </p>
              </div>
            </div>
            <span className={`text-sm font-bold shrink-0 ${positive ? "text-brand-hover" : "text-danger"}`}>
              {positive ? "+" : ""}
              {t.points}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function EditStudentModal({ student, onClose }: { student: Student; onClose: () => void }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(updateStudentAction, null);
  const [idType, setIdType] = useState(student.id_type);

  if (state?.success) onClose();

  return (
    <Modal title="تعديل بيانات الطالب" onClose={onClose} maxWidth="560px">
      <form action={formAction} className="space-y-(--space-4)">
        <input type="hidden" name="id" value={student.id} />
        <div>
          <Label htmlFor="full_name">الاسم الكامل</Label>
          <Input id="full_name" name="full_name" required defaultValue={student.full_name} />
        </div>
        <div className="grid sm:grid-cols-2 gap-(--space-3)">
          <div>
            <Label htmlFor="birth_date">تاريخ الميلاد</Label>
            <Input id="birth_date" name="birth_date" type="date" defaultValue={student.birth_date ?? ""} />
          </div>
          <div>
            <Label htmlFor="personal_number">الرقم الشخصي للطالب</Label>
            <Input id="personal_number" name="personal_number" defaultValue={student.personal_number ?? ""} />
          </div>
        </div>
        <div>
          <Label>نوع الهوية</Label>
          <div className="flex gap-(--space-2) mt-1">
            {ID_TYPE_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={`flex-1 h-11 flex items-center justify-center rounded-(--radius-sm) border text-[13px] font-semibold cursor-pointer transition-colors ${
                  idType === opt.value ? "border-brand bg-brand-soft text-brand-hover" : "border-line text-ink-muted"
                }`}
              >
                <input
                  type="radio"
                  name="id_type"
                  value={opt.value}
                  checked={idType === opt.value}
                  onChange={() => setIdType(opt.value)}
                  className="sr-only"
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-(--space-3)">
          <div>
            <Label htmlFor="national_id">رقم الهوية / الإقامة / الجواز</Label>
            <Input id="national_id" name="national_id" dir="ltr" defaultValue={student.national_id ?? ""} />
          </div>
          <div>
            <Label htmlFor="nationality">الجنسية</Label>
            <Input id="nationality" name="nationality" defaultValue={student.nationality ?? ""} />
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-(--space-3)">
          <div>
            <Label htmlFor="guardian_name">اسم ولي الأمر</Label>
            <Input id="guardian_name" name="guardian_name" defaultValue={student.guardian_name ?? ""} />
          </div>
          <div>
            <Label htmlFor="guardian_relation">صلة القرابة</Label>
            <Input id="guardian_relation" name="guardian_relation" defaultValue={student.guardian_relation ?? ""} />
          </div>
        </div>
        <div>
          <Label htmlFor="guardian_phone">جوال ولي الأمر</Label>
          <Input id="guardian_phone" name="guardian_phone" required dir="ltr" defaultValue={student.guardian_phone} />
        </div>
        <div>
          <Label htmlFor="address">العنوان</Label>
          <Input id="address" name="address" defaultValue={student.address ?? ""} />
        </div>
        <div>
          <Label htmlFor="notes">ملاحظات</Label>
          <Textarea id="notes" name="notes" rows={3} defaultValue={student.notes ?? ""} />
        </div>
        {state?.error && <p className="text-[13px] font-semibold text-danger">{state.error}</p>}
        <div className="flex justify-end gap-(--space-2) pt-(--space-2)">
          <Button type="button" variant="ghost" onClick={onClose}>
            إلغاء
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "جارِ الحفظ..." : "حفظ"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function DropoutModal({ studentId, onClose }: { studentId: string; onClose: () => void }) {
  const [reason, setReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [pending, setPending] = useState(false);

  return (
    <Modal title="تسجيل انقطاع الطالب" onClose={onClose}>
      <div className="space-y-(--space-4)">
        <div className="rounded-(--radius-sm) bg-danger-soft border border-danger px-(--space-3) py-(--space-3) text-[13px] font-semibold text-danger">
          هذا الإجراء سيخرج الطالب من القوائم النشطة والحضور. يمكن إرجاعه لاحقاً من هذه الصفحة.
        </div>
        <div>
          <Label htmlFor="reason">سبب الانقطاع (اختياري)</Label>
          <Textarea id="reason" value={reason} onChange={(e) => setReason(e.target.value)} rows={2} />
        </div>
        <label className="flex items-center gap-(--space-2) text-sm font-semibold text-ink">
          <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="h-5 w-5" />
          أؤكد رغبتي بتسجيل هذا الطالب كمنقطع
        </label>
        <div className="flex justify-end gap-(--space-2) pt-(--space-2)">
          <Button type="button" variant="ghost" onClick={onClose}>
            إلغاء
          </Button>
          <Button
            type="button"
            variant="danger"
            disabled={!confirmed || pending}
            onClick={async () => {
              setPending(true);
              await dropoutStudentAction(studentId, reason);
              onClose();
            }}
          >
            {pending ? "جارِ التنفيذ..." : "تأكيد الانقطاع"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function DeleteStudentModal({ studentId, studentName, onClose }: { studentId: string; studentName: string; onClose: () => void }) {
  const [confirmed, setConfirmed] = useState(false);
  const [pending, setPending] = useState(false);

  return (
    <Modal title="حذف الطالب نهائياً" onClose={onClose}>
      <div className="space-y-(--space-4)">
        <div className="rounded-(--radius-sm) bg-danger-soft border border-danger px-(--space-3) py-(--space-3) text-[13px] font-semibold text-danger">
          سيتم حذف بيانات &quot;{studentName}&quot; بالكامل — الحضور، النقاط، الإنجازات، والسجلات — نهائياً ولا يمكن التراجع عن هذا
          الإجراء.
        </div>
        <label className="flex items-center gap-(--space-2) text-sm font-semibold text-ink">
          <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="h-5 w-5" />
          أفهم أن هذا الإجراء نهائي ولا يمكن التراجع عنه
        </label>
        <div className="flex justify-end gap-(--space-2) pt-(--space-2)">
          <Button type="button" variant="ghost" onClick={onClose}>
            إلغاء
          </Button>
          <Button
            type="button"
            variant="danger"
            disabled={!confirmed || pending}
            onClick={async () => {
              setPending(true);
              await deleteStudentAction(studentId);
              window.location.href = "/admin/students";
            }}
          >
            {pending ? "جارِ الحذف..." : "حذف نهائياً"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function ReturnButton({ studentId }: { studentId: string }) {
  const [pending, setPending] = useState(false);
  return (
    <Button
      size="sm"
      variant="secondary"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        await returnStudentAction(studentId);
        setPending(false);
      }}
    >
      <UserCheck size={14} /> إرجاع الطالب
    </Button>
  );
}

function EnrollmentEditor({
  studentId,
  seasonId,
  enrollment,
  circles,
  groups,
}: {
  studentId: string;
  seasonId: string;
  enrollment: Enrollment | null;
  circles: { id: string; name: string }[];
  groups: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(updateEnrollmentAction, null);

  return (
    <form action={formAction} className="flex flex-col sm:flex-row gap-(--space-3) items-end">
      <input type="hidden" name="student_id" value={studentId} />
      <input type="hidden" name="season_id" value={seasonId} />
      {enrollment && <input type="hidden" name="enrollment_id" value={enrollment.id} />}
      <div className="flex-1 w-full">
        <Label htmlFor="circle_id">الحلقة</Label>
        <select
          id="circle_id"
          name="circle_id"
          defaultValue={enrollment?.circle_id ?? ""}
          className="h-11 w-full rounded-(--radius-sm) border border-line bg-surface-raised px-(--space-3) text-sm text-ink"
        >
          <option value="">بدون حلقة</option>
          {circles.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex-1 w-full">
        <Label htmlFor="group_id">المجموعة</Label>
        <select
          id="group_id"
          name="group_id"
          defaultValue={enrollment?.group_id ?? ""}
          className="h-11 w-full rounded-(--radius-sm) border border-line bg-surface-raised px-(--space-3) text-sm text-ink"
        >
          <option value="">بدون مجموعة</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </div>
      <Button type="submit" variant="secondary" disabled={pending} className="w-full sm:w-auto">
        {pending ? "..." : "حفظ"}
      </Button>
      {state?.error && <p className="text-[12px] text-danger">{state.error}</p>}
    </form>
  );
}

function AwardPanel({
  studentId,
  seasonId,
  allAchievements,
  allBadges,
  allFlags,
}: {
  studentId: string;
  seasonId: string;
  allAchievements: { id: string; name: string; points_awarded: number }[];
  allBadges: { id: string; name: string }[];
  allFlags: { id: string; name: string; severity: string }[];
}) {
  const [achievementId, setAchievementId] = useState("");
  const [badgeId, setBadgeId] = useState("");
  const [flagId, setFlagId] = useState("");
  const [pending, setPending] = useState(false);

  return (
    <div className="grid sm:grid-cols-3 gap-(--space-3)">
      <div className="flex gap-(--space-2)">
        <select
          value={achievementId}
          onChange={(e) => setAchievementId(e.target.value)}
          className="h-11 flex-1 rounded-(--radius-sm) border border-line bg-surface-raised px-(--space-2) text-[13px] text-ink"
        >
          <option value="">اختر إنجازاً</option>
          {allAchievements.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
        <Button
          size="sm"
          variant="secondary"
          disabled={!achievementId || pending}
          onClick={async () => {
            setPending(true);
            await awardAchievementAction(studentId, seasonId, achievementId);
            setAchievementId("");
            setPending(false);
          }}
        >
          <Award size={14} />
        </Button>
      </div>
      <div className="flex gap-(--space-2)">
        <select
          value={badgeId}
          onChange={(e) => setBadgeId(e.target.value)}
          className="h-11 flex-1 rounded-(--radius-sm) border border-line bg-surface-raised px-(--space-2) text-[13px] text-ink"
        >
          <option value="">اختر وساماً</option>
          {allBadges.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
        <Button
          size="sm"
          variant="secondary"
          disabled={!badgeId || pending}
          onClick={async () => {
            setPending(true);
            await awardBadgeAction(studentId, seasonId, badgeId);
            setBadgeId("");
            setPending(false);
          }}
        >
          <ShieldAlert size={14} />
        </Button>
      </div>
      <div className="flex gap-(--space-2)">
        <select
          value={flagId}
          onChange={(e) => setFlagId(e.target.value)}
          className="h-11 flex-1 rounded-(--radius-sm) border border-line bg-surface-raised px-(--space-2) text-[13px] text-ink"
        >
          <option value="">اختر علامة</option>
          {allFlags.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
        <Button
          size="sm"
          variant="secondary"
          disabled={!flagId || pending}
          onClick={async () => {
            setPending(true);
            await setStudentFlagAction(studentId, seasonId, flagId);
            setFlagId("");
            setPending(false);
          }}
        >
          <FlagIcon size={14} />
        </Button>
      </div>
    </div>
  );
}
