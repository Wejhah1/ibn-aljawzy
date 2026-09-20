"use client";

import { useActionState, useEffect, useState } from "react";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input, Label, Textarea } from "@/components/ui/input";
import {
  upsertAchievementAction,
  upsertBadgeAction,
  upsertFlagAction,
  toggleActiveAction,
  type FormState,
} from "./actions";
import { Plus, Pencil, Award, ShieldAlert, Flag as FlagIcon, EyeOff, Eye } from "lucide-react";

interface Achievement {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  points_awarded: number;
  is_active: boolean;
}
interface Badge_ {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  is_active: boolean;
}
interface Flag {
  id: string;
  name: string;
  description: string | null;
  severity: "info" | "warning" | "critical";
  requires_action: boolean;
  is_active: boolean;
}

type TabKey = "achievements" | "badges" | "flags";

export function AchievementsPageClient({
  achievements,
  badges,
  flags,
}: {
  achievements: Achievement[];
  badges: Badge_[];
  flags: Flag[];
}) {
  const [tab, setTab] = useState<TabKey>("achievements");
  const [achievementModal, setAchievementModal] = useState<Achievement | "new" | null>(null);
  const [badgeModal, setBadgeModal] = useState<Badge_ | "new" | null>(null);
  const [flagModal, setFlagModal] = useState<Flag | "new" | null>(null);

  return (
    <main className="p-(--space-4) md:p-(--space-8) max-w-[900px] mx-auto">
      <h1 className="text-[22px] leading-[30px] font-bold text-ink mb-(--space-6)">الإنجازات والأوسمة والعلامات</h1>

      <div className="flex items-center gap-(--space-2) mb-(--space-6)">
        <TabButton active={tab === "achievements"} onClick={() => setTab("achievements")} icon={Award} label="الإنجازات" />
        <TabButton active={tab === "badges"} onClick={() => setTab("badges")} icon={ShieldAlert} label="الأوسمة" />
        <TabButton active={tab === "flags"} onClick={() => setTab("flags")} icon={FlagIcon} label="العلامات" />
      </div>

      {tab === "achievements" && (
        <div>
          <div className="flex justify-end mb-(--space-4)">
            <Button size="sm" onClick={() => setAchievementModal("new")}>
              <Plus size={14} /> إنجاز جديد
            </Button>
          </div>
          <div className="space-y-(--space-2)">
            {achievements.length === 0 && (
              <Card>
                <CardDescription>لا توجد إنجازات بعد.</CardDescription>
              </Card>
            )}
            {achievements.map((a) => (
              <Card key={a.id} className={`flex items-center justify-between ${!a.is_active ? "opacity-60" : ""}`}>
                <div>
                  <div className="flex items-center gap-(--space-2)">
                    <CardTitle>{a.name}</CardTitle>
                    {a.points_awarded > 0 && <Badge tone="brand">+{a.points_awarded} نقطة</Badge>}
                  </div>
                  {a.description && <CardDescription>{a.description}</CardDescription>}
                </div>
                <div className="flex items-center gap-(--space-2)">
                  <Button size="sm" variant="outline" onClick={() => setAchievementModal(a)}>
                    <Pencil size={13} />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => toggleActiveAction("achievements", a.id, !a.is_active)}>
                    {a.is_active ? <Eye size={14} /> : <EyeOff size={14} />}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {tab === "badges" && (
        <div>
          <div className="flex justify-end mb-(--space-4)">
            <Button size="sm" onClick={() => setBadgeModal("new")}>
              <Plus size={14} /> وسام جديد
            </Button>
          </div>
          <div className="space-y-(--space-2)">
            {badges.length === 0 && (
              <Card>
                <CardDescription>لا توجد أوسمة بعد.</CardDescription>
              </Card>
            )}
            {badges.map((b) => (
              <Card key={b.id} className={`flex items-center justify-between ${!b.is_active ? "opacity-60" : ""}`}>
                <div>
                  <CardTitle>{b.name}</CardTitle>
                  {b.description && <CardDescription>{b.description}</CardDescription>}
                </div>
                <div className="flex items-center gap-(--space-2)">
                  <Button size="sm" variant="outline" onClick={() => setBadgeModal(b)}>
                    <Pencil size={13} />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => toggleActiveAction("badges", b.id, !b.is_active)}>
                    {b.is_active ? <Eye size={14} /> : <EyeOff size={14} />}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {tab === "flags" && (
        <div>
          <div className="flex justify-end mb-(--space-4)">
            <Button size="sm" onClick={() => setFlagModal("new")}>
              <Plus size={14} /> علامة جديدة
            </Button>
          </div>
          <div className="space-y-(--space-2)">
            {flags.length === 0 && (
              <Card>
                <CardDescription>لا توجد علامات بعد.</CardDescription>
              </Card>
            )}
            {flags.map((f) => (
              <Card key={f.id} className={`flex items-center justify-between ${!f.is_active ? "opacity-60" : ""}`}>
                <div>
                  <div className="flex items-center gap-(--space-2)">
                    <CardTitle>{f.name}</CardTitle>
                    <Badge tone={f.severity === "critical" ? "danger" : f.severity === "warning" ? "warning" : "info"}>
                      {f.severity === "critical" ? "حرجة" : f.severity === "warning" ? "تنبيه" : "معلومة"}
                    </Badge>
                    {f.requires_action && <Badge tone="neutral">تتطلب إجراء</Badge>}
                  </div>
                  {f.description && <CardDescription>{f.description}</CardDescription>}
                </div>
                <div className="flex items-center gap-(--space-2)">
                  <Button size="sm" variant="outline" onClick={() => setFlagModal(f)}>
                    <Pencil size={13} />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => toggleActiveAction("flags", f.id, !f.is_active)}>
                    {f.is_active ? <Eye size={14} /> : <EyeOff size={14} />}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {achievementModal && (
        <AchievementModal item={achievementModal === "new" ? null : achievementModal} onClose={() => setAchievementModal(null)} />
      )}
      {badgeModal && <BadgeModal item={badgeModal === "new" ? null : badgeModal} onClose={() => setBadgeModal(null)} />}
      {flagModal && <FlagModal item={flagModal === "new" ? null : flagModal} onClose={() => setFlagModal(null)} />}
    </main>
  );
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Award;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`h-11 px-(--space-4) rounded-(--radius-sm) border-bold text-sm font-bold flex items-center gap-2 transition-colors ${
        active
          ? "bg-brand text-on-brand border-line-strong shadow-brutal-sm"
          : "bg-surface-raised text-ink-muted border-line-strong hover:bg-surface-sunken"
      }`}
    >
      <Icon size={15} /> {label}
    </button>
  );
}

function AchievementModal({ item, onClose }: { item: Achievement | null; onClose: () => void }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(upsertAchievementAction, null);
  useEffect(() => {
    if (state?.success) onClose();
  }, [state, onClose]);

  return (
    <Modal title={item ? "تعديل الإنجاز" : "إنجاز جديد"} onClose={onClose}>
      <form action={formAction} className="space-y-(--space-4)">
        {item && <input type="hidden" name="id" value={item.id} />}
        <div>
          <Label htmlFor="name">الاسم</Label>
          <Input id="name" name="name" required defaultValue={item?.name} />
        </div>
        <div>
          <Label htmlFor="description">الوصف</Label>
          <Textarea id="description" name="description" rows={2} defaultValue={item?.description ?? ""} />
        </div>
        <div>
          <Label htmlFor="points_awarded">النقاط الممنوحة تلقائياً</Label>
          <Input id="points_awarded" name="points_awarded" type="number" defaultValue={item?.points_awarded ?? 0} />
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

function BadgeModal({ item, onClose }: { item: Badge_ | null; onClose: () => void }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(upsertBadgeAction, null);
  useEffect(() => {
    if (state?.success) onClose();
  }, [state, onClose]);

  return (
    <Modal title={item ? "تعديل الوسام" : "وسام جديد"} onClose={onClose}>
      <form action={formAction} className="space-y-(--space-4)">
        {item && <input type="hidden" name="id" value={item.id} />}
        <div>
          <Label htmlFor="name">الاسم</Label>
          <Input id="name" name="name" required defaultValue={item?.name} />
        </div>
        <div>
          <Label htmlFor="description">الوصف</Label>
          <Textarea id="description" name="description" rows={2} defaultValue={item?.description ?? ""} />
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

function FlagModal({ item, onClose }: { item: Flag | null; onClose: () => void }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(upsertFlagAction, null);
  useEffect(() => {
    if (state?.success) onClose();
  }, [state, onClose]);

  return (
    <Modal title={item ? "تعديل العلامة" : "علامة جديدة"} onClose={onClose}>
      <form action={formAction} className="space-y-(--space-4)">
        {item && <input type="hidden" name="id" value={item.id} />}
        <div>
          <Label htmlFor="name">الاسم</Label>
          <Input id="name" name="name" required defaultValue={item?.name} />
        </div>
        <div>
          <Label htmlFor="description">الوصف</Label>
          <Textarea id="description" name="description" rows={2} defaultValue={item?.description ?? ""} />
        </div>
        <div>
          <Label htmlFor="severity">الخطورة</Label>
          <select
            id="severity"
            name="severity"
            defaultValue={item?.severity ?? "info"}
            className="h-11 w-full rounded-(--radius-sm) border border-line bg-surface-raised px-(--space-3) text-sm text-ink"
          >
            <option value="info">معلومة</option>
            <option value="warning">تنبيه</option>
            <option value="critical">حرجة</option>
          </select>
        </div>
        <label className="flex items-center gap-(--space-2) text-sm font-semibold text-ink">
          <input type="checkbox" name="requires_action" defaultChecked={item?.requires_action} className="h-5 w-5" />
          تتطلب إجراءً من الإدارة
        </label>
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
