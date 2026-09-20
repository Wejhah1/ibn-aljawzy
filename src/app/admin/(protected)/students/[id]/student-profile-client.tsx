"use client";

import { useActionState, useState } from "react";
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
  type FormState,
} from "../actions";
import { ArrowRight, Pencil, UserX, UserCheck, Trophy, Award, CalendarCheck, ShieldAlert } from "lucide-react";

interface Student {
  id: string;
  code: string;
  full_name: string;
  birth_date: string | null;
  national_id: string | null;
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
  currentSeason,
}: {
  student: Student;
  enrollments: Enrollment[];
  attendanceBySeasonStatus: Record<string, Record<string, number>>;
  achievements: { season_id: string; achievements: { name: string; icon: string | null } | { name: string; icon: string | null }[] | null }[];
  badges: { season_id: string; badges: { name: string; icon: string | null } | { name: string; icon: string | null }[] | null }[];
  dropoutPeriods: { dropped_at: string; returned_at: string | null; reason: string | null }[];
  circles: { id: string; name: string; groups: { id: string; name: string }[] }[];
  currentSeason: { id: string; name: string } | null;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [dropoutOpen, setDropoutOpen] = useState(false);

  const currentEnrollment = enrollments.find((e) => e.season_id === currentSeason?.id);

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
              </div>
              <p className="text-sm text-ink-muted mt-1">
                ولي الأمر: {student.guardian_name ?? "—"} ({student.guardian_relation ?? "—"}) · {student.guardian_phone}
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
          />
        </Card>
      )}

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
    </main>
  );
}

function EditStudentModal({ student, onClose }: { student: Student; onClose: () => void }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(updateStudentAction, null);

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
            <Label htmlFor="national_id">رقم الهوية</Label>
            <Input id="national_id" name="national_id" defaultValue={student.national_id ?? ""} />
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
}: {
  studentId: string;
  seasonId: string;
  enrollment: Enrollment | null;
  circles: { id: string; name: string; groups: { id: string; name: string }[] }[];
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(updateEnrollmentAction, null);
  const [circleId, setCircleId] = useState(enrollment?.circle_id ?? "");
  const groups = circles.find((c) => c.id === circleId)?.groups ?? [];

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
          value={circleId}
          onChange={(e) => setCircleId(e.target.value)}
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
          disabled={!circleId}
          className="h-11 w-full rounded-(--radius-sm) border border-line bg-surface-raised px-(--space-3) text-sm text-ink disabled:opacity-(--opacity-disabled)"
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
