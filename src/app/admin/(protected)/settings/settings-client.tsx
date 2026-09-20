"use client";

import { useActionState, useEffect, useState } from "react";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import type { ProgramInfo } from "@/lib/settings";
import {
  saveProgramInfoAction,
  saveWhatsappTemplateAction,
  saveWhatsappApiConfigAction,
  inviteUserAction,
  updateUserRoleAction,
  toggleUserActiveAction,
  changePasswordAction,
  type FormState,
} from "./actions";
import { Building2, MessageCircle, Users, ScrollText, ShieldCheck, Plus, Pencil, Eye, EyeOff } from "lucide-react";

type TabKey = "program" | "whatsapp" | "users" | "audit" | "security";

const TABS: { key: TabKey; label: string; icon: typeof Building2 }[] = [
  { key: "program", label: "معلومات البرنامج", icon: Building2 },
  { key: "whatsapp", label: "رسائل واتساب", icon: MessageCircle },
  { key: "users", label: "المستخدمون", icon: Users },
  { key: "audit", label: "سجل العمليات", icon: ScrollText },
  { key: "security", label: "الحساب والأمان", icon: ShieldCheck },
];

const CONTEXT_LABELS: Record<string, string> = {
  attendance_absent: "غياب في كشف الحضور",
  attendance_late: "تأخر في كشف الحضور",
  students_list_contact: "تواصل من قائمة الطلاب",
  quick_ops_contact: "تواصل من العمليات السريعة",
};

interface Profile {
  id: string;
  full_name: string;
  role: "admin" | "supervisor" | "data_entry";
  is_active: boolean;
  created_at: string;
}

interface Template {
  id: string;
  context: string;
  label: string;
  body: string;
}

interface AuditRow {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  created_at: string;
  metadata: unknown;
  profiles: { full_name: string } | { full_name: string }[] | null;
}

export function SettingsClient({
  myRole,
  programInfo,
  templates,
  cloudApiEnabled,
  profiles,
  auditLog,
  currentUserId,
}: {
  myRole: string;
  programInfo: ProgramInfo;
  templates: Template[];
  cloudApiEnabled: boolean;
  profiles: Profile[];
  auditLog: AuditRow[];
  currentUserId: string;
}) {
  const [tab, setTab] = useState<TabKey>("program");
  const isAdmin = myRole === "admin";

  return (
    <main className="p-(--space-4) md:p-(--space-8) max-w-[900px] mx-auto">
      <h1 className="text-[22px] leading-[30px] font-bold text-ink mb-(--space-6)">الإدارة والإعدادات</h1>

      <div className="flex items-center gap-(--space-2) mb-(--space-6) flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`h-11 px-(--space-4) rounded-(--radius-sm) border-bold text-sm font-bold flex items-center gap-2 ${
              tab === t.key ? "bg-brand text-on-brand border-line-strong shadow-brutal-sm" : "bg-surface-raised text-ink-muted border-line-strong"
            }`}
          >
            <t.icon size={15} /> {t.label}
          </button>
        ))}
      </div>

      {tab === "program" && <ProgramInfoTab initial={programInfo} />}
      {tab === "whatsapp" && <WhatsappTab templates={templates} cloudApiEnabled={cloudApiEnabled} />}
      {tab === "users" && <UsersTab profiles={profiles} isAdmin={isAdmin} currentUserId={currentUserId} />}
      {tab === "audit" && <AuditTab rows={auditLog} />}
      {tab === "security" && <SecurityTab />}
    </main>
  );
}

function ProgramInfoTab({ initial }: { initial: ProgramInfo }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(saveProgramInfoAction, null);
  return (
    <Card>
      <form action={formAction} className="space-y-(--space-4)">
        <div>
          <Label htmlFor="program_name">اسم البرنامج</Label>
          <Input id="program_name" name="program_name" defaultValue={initial.program_name} />
        </div>
        <div>
          <Label htmlFor="mosque_name">اسم المسجد</Label>
          <Input id="mosque_name" name="mosque_name" defaultValue={initial.mosque_name} />
        </div>
        <div>
          <Label htmlFor="address">العنوان</Label>
          <Input id="address" name="address" defaultValue={initial.address} />
        </div>
        <div>
          <Label htmlFor="contact_phone">رقم تواصل البرنامج</Label>
          <Input id="contact_phone" name="contact_phone" dir="ltr" defaultValue={initial.contact_phone} />
        </div>
        {state?.success && <p className="text-[13px] font-semibold text-brand">تم الحفظ بنجاح.</p>}
        <div className="flex justify-end">
          <Button type="submit" disabled={pending}>
            حفظ
          </Button>
        </div>
      </form>
    </Card>
  );
}

function WhatsappTab({ templates, cloudApiEnabled }: { templates: Template[]; cloudApiEnabled: boolean }) {
  const [editing, setEditing] = useState<Template | null>(null);
  const [apiState, apiFormAction] = useActionState<FormState, FormData>(saveWhatsappApiConfigAction, null);

  return (
    <div className="space-y-(--space-6)">
      <Card>
        <CardTitle className="mb-(--space-3)">WhatsApp Cloud API (Meta)</CardTitle>
        <CardDescription className="mb-(--space-4)">
          فعّل الإرسال الجماعي التلقائي الحقيقي عند توفر مفاتيح API صالحة في متغيرات البيئة (WHATSAPP_CLOUD_API_TOKEN،
          WHATSAPP_CLOUD_API_PHONE_NUMBER_ID). عند التعطيل أو انتهاء الحد المجاني، يعود النظام تلقائياً لروابط wa.me
          اليدوية.
        </CardDescription>
        <form action={apiFormAction} className="flex items-center justify-between">
          <label className="flex items-center gap-(--space-2) text-sm font-semibold text-ink">
            <input type="checkbox" name="is_enabled" defaultChecked={cloudApiEnabled} className="h-5 w-5" />
            تفعيل الإرسال عبر Cloud API
          </label>
          <Button type="submit" size="sm" variant="secondary">
            حفظ
          </Button>
        </form>
        {apiState?.success && <p className="text-[12px] text-brand mt-(--space-2)">تم الحفظ.</p>}
      </Card>

      <div>
        <p className="text-[13px] font-bold text-ink mb-(--space-3)">قوالب الرسائل</p>
        <p className="text-[12px] text-ink-muted mb-(--space-3)">
          المتغيرات المتاحة: {"{name} {program} {mosque} {barcode} {date} {day} {status} {circle}"}
        </p>
        <div className="space-y-(--space-2)">
          {templates.map((t) => (
            <Card key={t.id} className="flex items-center justify-between gap-(--space-3)">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink">{CONTEXT_LABELS[t.context] ?? t.context}</p>
                <p className="text-[12px] text-ink-muted truncate">{t.body}</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => setEditing(t)}>
                <Pencil size={13} />
              </Button>
            </Card>
          ))}
        </div>
      </div>

      {editing && <TemplateEditModal template={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function TemplateEditModal({ template, onClose }: { template: Template; onClose: () => void }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(saveWhatsappTemplateAction, null);
  useEffect(() => {
    if (state?.success) onClose();
  }, [state, onClose]);

  return (
    <Modal title={CONTEXT_LABELS[template.context] ?? template.context} onClose={onClose}>
      <form action={formAction} className="space-y-(--space-4)">
        <input type="hidden" name="context" value={template.context} />
        <div>
          <Label htmlFor="body">نص الرسالة</Label>
          <Textarea id="body" name="body" rows={5} defaultValue={template.body} />
        </div>
        {state?.error && <p className="text-[13px] font-semibold text-danger">{state.error}</p>}
        <div className="flex justify-end gap-(--space-2)">
          <Button type="button" variant="ghost" onClick={onClose}>
            إلغاء
          </Button>
          <Button type="submit" disabled={pending}>
            حفظ
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function UsersTab({ profiles, isAdmin, currentUserId }: { profiles: Profile[]; isAdmin: boolean; currentUserId: string }) {
  const [inviteOpen, setInviteOpen] = useState(false);

  return (
    <div>
      {isAdmin && (
        <div className="flex justify-end mb-(--space-4)">
          <Button size="sm" onClick={() => setInviteOpen(true)}>
            <Plus size={14} /> مستخدم جديد
          </Button>
        </div>
      )}
      <div className="space-y-(--space-2)">
        {profiles.map((p) => (
          <Card key={p.id} className="flex items-center justify-between flex-wrap gap-(--space-2)">
            <div className="flex items-center gap-(--space-3)">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-soft text-brand-hover font-bold text-sm">
                {p.full_name.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-semibold text-ink">
                  {p.full_name} {p.id === currentUserId && <span className="text-ink-faint">(أنت)</span>}
                </p>
                <p className="text-[12px] text-ink-muted">{new Date(p.created_at).toLocaleDateString("ar-SA")}</p>
              </div>
            </div>
            <div className="flex items-center gap-(--space-2)">
              {isAdmin ? (
                <select
                  defaultValue={p.role}
                  onChange={(e) => updateUserRoleAction(p.id, e.target.value as "admin" | "supervisor" | "data_entry")}
                  className="h-9 rounded-(--radius-sm) border border-line bg-surface-raised px-(--space-2) text-[13px] text-ink"
                >
                  <option value="admin">مدير</option>
                  <option value="supervisor">مشرف</option>
                  <option value="data_entry">إدخال بيانات</option>
                </select>
              ) : (
                <Badge tone="neutral">{p.role === "admin" ? "مدير" : p.role === "supervisor" ? "مشرف" : "إدخال بيانات"}</Badge>
              )}
              {isAdmin && p.id !== currentUserId && (
                <Button size="sm" variant="ghost" onClick={() => toggleUserActiveAction(p.id, !p.is_active)}>
                  {p.is_active ? <Eye size={14} /> : <EyeOff size={14} />}
                </Button>
              )}
              {!p.is_active && <Badge tone="danger">معطّل</Badge>}
            </div>
          </Card>
        ))}
      </div>

      {inviteOpen && <InviteUserModal onClose={() => setInviteOpen(false)} />}
    </div>
  );
}

function InviteUserModal({ onClose }: { onClose: () => void }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(inviteUserAction, null);
  useEffect(() => {
    if (state?.success) onClose();
  }, [state, onClose]);

  return (
    <Modal title="مستخدم جديد" onClose={onClose}>
      <form action={formAction} className="space-y-(--space-4)">
        <div>
          <Label htmlFor="full_name">الاسم الكامل</Label>
          <Input id="full_name" name="full_name" required />
        </div>
        <div>
          <Label htmlFor="username">اسم المستخدم</Label>
          <Input id="username" name="username" required />
        </div>
        <div>
          <Label htmlFor="password">كلمة المرور</Label>
          <Input id="password" name="password" type="password" required minLength={8} />
        </div>
        <div>
          <Label htmlFor="role">الصلاحية</Label>
          <select
            id="role"
            name="role"
            defaultValue="data_entry"
            className="h-11 w-full rounded-(--radius-sm) border border-line bg-surface-raised px-(--space-3) text-sm text-ink"
          >
            <option value="data_entry">إدخال بيانات</option>
            <option value="supervisor">مشرف</option>
            <option value="admin">مدير</option>
          </select>
        </div>
        {state?.error && <p className="text-[13px] font-semibold text-danger">{state.error}</p>}
        <div className="flex justify-end gap-(--space-2)">
          <Button type="button" variant="ghost" onClick={onClose}>
            إلغاء
          </Button>
          <Button type="submit" disabled={pending}>
            إنشاء
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function AuditTab({ rows }: { rows: AuditRow[] }) {
  return (
    <div className="space-y-(--space-2)">
      {rows.length === 0 && (
        <Card>
          <CardDescription>لا توجد عمليات مسجّلة بعد.</CardDescription>
        </Card>
      )}
      {rows.map((r) => {
        const actor = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
        return (
          <Card key={r.id} className="flex items-center justify-between text-sm">
            <div>
              <span className="font-semibold text-ink">{actor?.full_name ?? "النظام"}</span>{" "}
              <span className="text-ink-muted">— {r.action}</span>
            </div>
            <span className="text-[12px] text-ink-faint">
              {new Date(r.created_at).toLocaleString("ar-SA", { dateStyle: "short", timeStyle: "short" })}
            </span>
          </Card>
        );
      })}
    </div>
  );
}

function SecurityTab() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(changePasswordAction, null);
  return (
    <Card className="max-w-[420px]">
      <CardTitle className="mb-(--space-4)">تغيير كلمة المرور</CardTitle>
      <form action={formAction} className="space-y-(--space-4)">
        <div>
          <Label htmlFor="password">كلمة المرور الجديدة</Label>
          <Input id="password" name="password" type="password" required minLength={8} />
        </div>
        <div>
          <Label htmlFor="confirm_password">تأكيد كلمة المرور</Label>
          <Input id="confirm_password" name="confirm_password" type="password" required minLength={8} />
        </div>
        {state?.error && <p className="text-[13px] font-semibold text-danger">{state.error}</p>}
        {state?.success && <p className="text-[13px] font-semibold text-brand">تم تحديث كلمة المرور.</p>}
        <Button type="submit" disabled={pending}>
          تحديث
        </Button>
      </form>
    </Card>
  );
}
