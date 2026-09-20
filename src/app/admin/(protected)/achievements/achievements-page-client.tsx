"use client";

import { useActionState, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input, Label, Textarea } from "@/components/ui/input";
import { IconPicker } from "@/components/badges/icon-picker";
import {
  upsertAchievementAction,
  upsertBadgeAction,
  upsertFlagAction,
  toggleActiveAction,
  searchStudentsAction,
  grantAchievementAction,
  grantBadgeAction,
  grantFlagAction,
  type FormState,
} from "./actions";
import { Plus, Pencil, Award, ShieldAlert, Flag as FlagIcon, EyeOff, Eye, Search, UserPlus, Clock } from "lucide-react";

interface Achievement {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  points_awarded: number;
  is_active: boolean;
  display_duration_days: number | null;
}
interface Badge_ {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  is_active: boolean;
  display_duration_days: number | null;
}
interface Flag {
  id: string;
  name: string;
  description: string | null;
  severity: "info" | "warning" | "critical";
  requires_action: boolean;
  is_active: boolean;
  display_duration_days: number | null;
}

type TabKey = "achievements" | "badges" | "flags";
type GrantTarget = { kind: TabKey; id: string; name: string };

const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.18, ease: [0.2, 0, 0, 1] as const } },
};

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
  const [grantTarget, setGrantTarget] = useState<GrantTarget | null>(null);

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
          <motion.div variants={listVariants} initial="hidden" animate="show" className="space-y-(--space-2)">
            {achievements.length === 0 && (
              <Card>
                <CardDescription>لا توجد إنجازات بعد.</CardDescription>
              </Card>
            )}
            {achievements.map((a) => (
              <motion.div key={a.id} variants={itemVariants}>
                <Card className={`flex items-center justify-between flex-wrap gap-(--space-2) ${!a.is_active ? "opacity-60" : ""}`}>
                  <div className="flex items-center gap-(--space-3)">
                    <span className="text-2xl">{a.icon || "🏅"}</span>
                    <div>
                      <div className="flex items-center gap-(--space-2) flex-wrap">
                        <CardTitle>{a.name}</CardTitle>
                        {a.points_awarded > 0 && <Badge tone="brand">+{a.points_awarded} نقطة</Badge>}
                        {a.display_duration_days && (
                          <Badge tone="neutral">
                            <Clock size={11} /> {a.display_duration_days} يوم
                          </Badge>
                        )}
                      </div>
                      {a.description && <CardDescription>{a.description}</CardDescription>}
                    </div>
                  </div>
                  <div className="flex items-center gap-(--space-2)">
                    <Button size="sm" variant="secondary" onClick={() => setGrantTarget({ kind: "achievements", id: a.id, name: a.name })}>
                      <UserPlus size={13} /> منح
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setAchievementModal(a)}>
                      <Pencil size={13} />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => toggleActiveAction("achievements", a.id, !a.is_active)}>
                      {a.is_active ? <Eye size={14} /> : <EyeOff size={14} />}
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      )}

      {tab === "badges" && (
        <div>
          <div className="flex justify-end mb-(--space-4)">
            <Button size="sm" onClick={() => setBadgeModal("new")}>
              <Plus size={14} /> وسام جديد
            </Button>
          </div>
          <motion.div variants={listVariants} initial="hidden" animate="show" className="space-y-(--space-2)">
            {badges.length === 0 && (
              <Card>
                <CardDescription>لا توجد أوسمة بعد.</CardDescription>
              </Card>
            )}
            {badges.map((b) => (
              <motion.div key={b.id} variants={itemVariants}>
                <Card className={`flex items-center justify-between flex-wrap gap-(--space-2) ${!b.is_active ? "opacity-60" : ""}`}>
                  <div className="flex items-center gap-(--space-3)">
                    <span className="text-2xl">{b.icon || "🏅"}</span>
                    <div>
                      <div className="flex items-center gap-(--space-2) flex-wrap">
                        <CardTitle>{b.name}</CardTitle>
                        {b.display_duration_days ? (
                          <Badge tone="neutral">
                            <Clock size={11} /> يظهر {b.display_duration_days} يوم بالقوائم
                          </Badge>
                        ) : (
                          <Badge tone="neutral">يظهر دائماً</Badge>
                        )}
                      </div>
                      {b.description && <CardDescription>{b.description}</CardDescription>}
                    </div>
                  </div>
                  <div className="flex items-center gap-(--space-2)">
                    <Button size="sm" variant="secondary" onClick={() => setGrantTarget({ kind: "badges", id: b.id, name: b.name })}>
                      <UserPlus size={13} /> منح
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setBadgeModal(b)}>
                      <Pencil size={13} />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => toggleActiveAction("badges", b.id, !b.is_active)}>
                      {b.is_active ? <Eye size={14} /> : <EyeOff size={14} />}
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      )}

      {tab === "flags" && (
        <div>
          <div className="flex justify-end mb-(--space-4)">
            <Button size="sm" onClick={() => setFlagModal("new")}>
              <Plus size={14} /> علامة جديدة
            </Button>
          </div>
          <motion.div variants={listVariants} initial="hidden" animate="show" className="space-y-(--space-2)">
            {flags.length === 0 && (
              <Card>
                <CardDescription>لا توجد علامات بعد.</CardDescription>
              </Card>
            )}
            {flags.map((f) => (
              <motion.div key={f.id} variants={itemVariants}>
                <Card className={`flex items-center justify-between flex-wrap gap-(--space-2) ${!f.is_active ? "opacity-60" : ""}`}>
                  <div>
                    <div className="flex items-center gap-(--space-2) flex-wrap">
                      <CardTitle>{f.name}</CardTitle>
                      <Badge tone={f.severity === "critical" ? "danger" : f.severity === "warning" ? "warning" : "info"}>
                        {f.severity === "critical" ? "حرجة" : f.severity === "warning" ? "تنبيه" : "معلومة"}
                      </Badge>
                      {f.requires_action && <Badge tone="neutral">تتطلب إجراء</Badge>}
                    </div>
                    {f.description && <CardDescription>{f.description}</CardDescription>}
                  </div>
                  <div className="flex items-center gap-(--space-2)">
                    <Button size="sm" variant="secondary" onClick={() => setGrantTarget({ kind: "flags", id: f.id, name: f.name })}>
                      <UserPlus size={13} /> منح
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setFlagModal(f)}>
                      <Pencil size={13} />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => toggleActiveAction("flags", f.id, !f.is_active)}>
                      {f.is_active ? <Eye size={14} /> : <EyeOff size={14} />}
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      )}

      {achievementModal && (
        <AchievementModal item={achievementModal === "new" ? null : achievementModal} onClose={() => setAchievementModal(null)} />
      )}
      {badgeModal && <BadgeModal item={badgeModal === "new" ? null : badgeModal} onClose={() => setBadgeModal(null)} />}
      {flagModal && <FlagModal item={flagModal === "new" ? null : flagModal} onClose={() => setFlagModal(null)} />}
      {grantTarget && <GrantModal target={grantTarget} onClose={() => setGrantTarget(null)} />}
    </main>
  );
}

function GrantModal({ target, onClose }: { target: GrantTarget; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ id: string; full_name: string; code: string }[]>([]);
  const [granted, setGranted] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const grant = async (studentId: string) => {
    setPending(studentId);
    setError(null);
    const action = target.kind === "achievements" ? grantAchievementAction : target.kind === "badges" ? grantBadgeAction : grantFlagAction;
    const result = await action(studentId, target.id);
    setPending(null);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setGranted((prev) => new Set(prev).add(studentId));
  };

  return (
    <Modal title={`منح "${target.name}"`} onClose={onClose}>
      <div className="space-y-(--space-4)">
        <div className="relative">
          <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint" />
          <Input
            value={query}
            onChange={async (e) => {
              setQuery(e.target.value);
              setResults(await searchStudentsAction(e.target.value));
            }}
            placeholder="ابحث عن طالب بالاسم أو الكود..."
            className="pr-9"
            autoFocus
          />
        </div>
        {error && <p className="text-[13px] font-semibold text-danger">{error}</p>}
        <div className="space-y-(--space-2) max-h-[320px] overflow-y-auto">
          {results.map((s) => {
            const isGranted = granted.has(s.id);
            return (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-(--radius-sm) border border-line bg-surface-raised px-(--space-3) py-(--space-2)"
              >
                <div>
                  <p className="text-sm font-semibold text-ink">{s.full_name}</p>
                  <p className="text-[12px] text-ink-faint">#{s.code}</p>
                </div>
                <Button size="sm" variant={isGranted ? "ghost" : "secondary"} disabled={isGranted || pending === s.id} onClick={() => grant(s.id)}>
                  {isGranted ? "تم المنح ✓" : pending === s.id ? "جارِ المنح..." : "منح"}
                </Button>
              </div>
            );
          })}
        </div>
        <div className="flex justify-end">
          <Button type="button" variant="ghost" onClick={onClose}>
            إغلاق
          </Button>
        </div>
      </div>
    </Modal>
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

function DurationField({ defaultValue }: { defaultValue?: number | null }) {
  return (
    <div>
      <Label htmlFor="display_duration_days">مدة الظهور في القوائم والمتصدرين (بالأيام)</Label>
      <Input
        id="display_duration_days"
        name="display_duration_days"
        type="number"
        min={1}
        defaultValue={defaultValue ?? ""}
        placeholder="اتركه فارغاً ليظهر دائماً"
      />
      <p className="text-[12px] text-ink-faint mt-1">
        بعد انتهاء المدة يختفي من القوائم والمتصدرين تلقائياً، لكنه يبقى ظاهراً دائماً في صفحة الطالب وبوابة ولي الأمر.
      </p>
    </div>
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
        <IconPicker name="icon" defaultValue={item?.icon} />
        <div>
          <Label htmlFor="points_awarded">النقاط الممنوحة تلقائياً</Label>
          <Input id="points_awarded" name="points_awarded" type="number" defaultValue={item?.points_awarded ?? 0} />
        </div>
        <DurationField defaultValue={item?.display_duration_days} />
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
        <IconPicker name="icon" defaultValue={item?.icon} />
        <DurationField defaultValue={item?.display_duration_days} />
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
        <DurationField defaultValue={item?.display_duration_days} />
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
