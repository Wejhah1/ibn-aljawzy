"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Plus, Pencil, Phone, Users, CircleDot, Trash2, Eye, GraduationCap } from "lucide-react";
import { CircleFormModal } from "./circle-form-modal";
import { GroupFormModal } from "./group-form-modal";
import { RosterPosterModal } from "./roster-poster-modal";
import { deleteCircleAction, deleteGroupAction } from "./actions";
import type { ProgramInfo } from "@/lib/settings";

interface Group {
  id: string;
  name: string;
  leader_name: string | null;
  leader_phone: string | null;
  color_token: string;
}
interface Circle {
  id: string;
  name: string;
  leader_name: string | null;
  leader_phone: string | null;
  teacher_name: string | null;
  teacher_phone: string | null;
  color_token: string;
  is_active: boolean;
}

const TONE_STYLE: Record<string, { fg: string; bg: string }> = {
  "group-1": { fg: "var(--color-group-1-fg)", bg: "var(--color-group-1-bg)" },
  "group-2": { fg: "var(--color-group-2-fg)", bg: "var(--color-group-2-bg)" },
  "group-3": { fg: "var(--color-group-3-fg)", bg: "var(--color-group-3-bg)" },
  "group-4": { fg: "var(--color-group-4-fg)", bg: "var(--color-group-4-bg)" },
  "group-5": { fg: "var(--color-group-5-fg)", bg: "var(--color-group-5-bg)" },
  "group-6": { fg: "var(--color-group-6-fg)", bg: "var(--color-group-6-bg)" },
};

const listVariants = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } };
const itemVariants = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.18, ease: [0.2, 0, 0, 1] as const } } };

export function CirclesPageClient({
  circles,
  groups,
  currentSeasonId,
  circleCounts,
  groupCounts,
  programInfo,
}: {
  circles: Circle[];
  groups: Group[];
  currentSeasonId: string | null;
  circleCounts: Record<string, number>;
  groupCounts: Record<string, number>;
  programInfo: ProgramInfo;
}) {
  const [newCircleOpen, setNewCircleOpen] = useState(false);
  const [editCircle, setEditCircle] = useState<Circle | null>(null);
  const [deleteCircle, setDeleteCircle] = useState<Circle | null>(null);
  const [viewCircle, setViewCircle] = useState<Circle | null>(null);
  const [newGroupOpen, setNewGroupOpen] = useState(false);
  const [editGroup, setEditGroup] = useState<Group | null>(null);
  const [deleteGroup, setDeleteGroup] = useState<Group | null>(null);
  const [viewGroup, setViewGroup] = useState<Group | null>(null);

  return (
    <main className="p-(--space-4) md:p-(--space-8) max-w-[1000px] mx-auto">
      <div className="mb-(--space-8)">
        <h1 className="text-[22px] leading-[30px] font-bold text-ink">الحلقات والمجموعات</h1>
        <p className="text-sm text-ink-muted mt-1">
          الحلقات والمجموعات تصنيفان مستقلان — أضِف كلاً منهما بشكل منفصل، ثم اختر لكل طالب حلقته ومجموعته دون ارتباط بينهما.
        </p>
      </div>

      {/* الحلقات */}
      <div className="flex items-center justify-between mb-(--space-4)">
        <h2 className="text-[16px] font-bold text-ink flex items-center gap-2">
          <CircleDot size={18} className="text-brand" /> الحلقات
        </h2>
        <Button size="sm" onClick={() => setNewCircleOpen(true)}>
          <Plus size={14} /> حلقة جديدة
        </Button>
      </div>
      <motion.div variants={listVariants} initial="hidden" animate="show" className="space-y-(--space-3) mb-(--space-8)">
        {circles.length === 0 && (
          <Card>
            <CardDescription>لا توجد حلقات بعد.</CardDescription>
          </Card>
        )}
        {circles.map((circle) => {
          const tone = TONE_STYLE[circle.color_token] ?? TONE_STYLE["group-1"];
          return (
            <motion.div key={circle.id} variants={itemVariants}>
              <Card className="flex items-center justify-between gap-(--space-3) flex-wrap">
                <div className="flex items-center gap-(--space-3)">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-(--radius-sm) shrink-0"
                    style={{ backgroundColor: tone.bg, color: tone.fg }}
                  >
                    <CircleDot size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-(--space-2)">
                      <CardTitle>{circle.name}</CardTitle>
                      <Badge tone="neutral">{circleCounts[circle.id] ?? 0} طالب</Badge>
                    </div>
                    <div className="flex items-center gap-(--space-3) flex-wrap mt-1">
                      {circle.teacher_name && (
                        <CardDescription className="flex items-center gap-1">
                          <GraduationCap size={12} /> {circle.teacher_name}
                        </CardDescription>
                      )}
                      {circle.leader_name && (
                        <CardDescription className="flex items-center gap-1">
                          <Users size={12} /> {circle.leader_name}
                          {circle.leader_phone && (
                            <>
                              {" "}
                              · <Phone size={12} /> {circle.leader_phone}
                            </>
                          )}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-(--space-2)">
                  <Button size="sm" variant="secondary" onClick={() => setViewCircle(circle)}>
                    <Eye size={14} /> عرض
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditCircle(circle)}>
                    <Pencil size={14} /> تعديل
                  </Button>
                  <button
                    onClick={() => setDeleteCircle(circle)}
                    className="flex h-9 w-9 items-center justify-center rounded-(--radius-sm) text-danger hover:bg-danger-soft"
                    title="حذف الحلقة"
                    aria-label="حذف الحلقة"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {/* المجموعات */}
      <div className="flex items-center justify-between mb-(--space-4)">
        <h2 className="text-[16px] font-bold text-ink flex items-center gap-2">
          <Users size={18} className="text-brand" /> المجموعات
        </h2>
        <Button size="sm" onClick={() => setNewGroupOpen(true)}>
          <Plus size={14} /> مجموعة جديدة
        </Button>
      </div>
      <motion.div variants={listVariants} initial="hidden" animate="show" className="grid sm:grid-cols-2 gap-(--space-2)">
        {groups.length === 0 && (
          <Card className="sm:col-span-2">
            <CardDescription>لا توجد مجموعات بعد.</CardDescription>
          </Card>
        )}
        {groups.map((group) => {
          const tone = TONE_STYLE[group.color_token] ?? TONE_STYLE["group-1"];
          return (
            <motion.div
              key={group.id}
              variants={itemVariants}
              className="flex items-center justify-between rounded-(--radius-sm) border border-line bg-surface-raised px-(--space-3) py-(--space-3)"
            >
              <div className="flex items-center gap-(--space-2)">
                <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: tone.fg }} />
                <div>
                  <p className="text-sm font-semibold text-ink">{group.name}</p>
                  {group.leader_name && <p className="text-[12px] text-ink-muted">{group.leader_name}</p>}
                </div>
              </div>
              <div className="flex items-center gap-(--space-1)">
                <Badge tone="neutral">{groupCounts[group.id] ?? 0}</Badge>
                <button
                  onClick={() => setViewGroup(group)}
                  className="flex h-8 w-8 items-center justify-center rounded-(--radius-xs) text-ink-muted hover:bg-surface-sunken hover:text-ink"
                >
                  <Eye size={13} />
                </button>
                <button
                  onClick={() => setEditGroup(group)}
                  className="flex h-8 w-8 items-center justify-center rounded-(--radius-xs) text-ink-muted hover:bg-surface-sunken hover:text-ink"
                >
                  <Pencil size={13} />
                </button>
                <button
                  onClick={() => setDeleteGroup(group)}
                  className="flex h-8 w-8 items-center justify-center rounded-(--radius-xs) text-danger hover:bg-danger-soft"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {newCircleOpen && <CircleFormModal seasonId={currentSeasonId} onClose={() => setNewCircleOpen(false)} />}
      {editCircle && <CircleFormModal circle={editCircle} onClose={() => setEditCircle(null)} />}
      {newGroupOpen && <GroupFormModal existingCount={groups.length} onClose={() => setNewGroupOpen(false)} />}
      {editGroup && <GroupFormModal group={editGroup} onClose={() => setEditGroup(null)} />}

      {viewCircle && (
        <RosterPosterModal
          kind="circle"
          id={viewCircle.id}
          name={viewCircle.name}
          leaderName={viewCircle.teacher_name}
          colorToken={viewCircle.color_token}
          programInfo={programInfo}
          onClose={() => setViewCircle(null)}
        />
      )}
      {viewGroup && (
        <RosterPosterModal
          kind="group"
          id={viewGroup.id}
          name={viewGroup.name}
          leaderName={viewGroup.leader_name}
          colorToken={viewGroup.color_token}
          programInfo={programInfo}
          onClose={() => setViewGroup(null)}
        />
      )}

      {deleteCircle && (
        <ConfirmDeleteModal
          title="حذف الحلقة"
          message={`سيتم حذف حلقة "${deleteCircle.name}" نهائياً. الطلاب المسجّلون فيها لن يُحذفوا، لكن ستُزال حلقتهم.`}
          onCancel={() => setDeleteCircle(null)}
          onConfirm={async () => {
            await deleteCircleAction(deleteCircle.id);
            setDeleteCircle(null);
          }}
        />
      )}
      {deleteGroup && (
        <ConfirmDeleteModal
          title="حذف المجموعة"
          message={`سيتم حذف مجموعة "${deleteGroup.name}" نهائياً. الطلاب المسجّلون فيها لن يُحذفوا، لكن ستُزال مجموعتهم.`}
          onCancel={() => setDeleteGroup(null)}
          onConfirm={async () => {
            await deleteGroupAction(deleteGroup.id);
            setDeleteGroup(null);
          }}
        />
      )}
    </main>
  );
}

function ConfirmDeleteModal({
  title,
  message,
  onCancel,
  onConfirm,
}: {
  title: string;
  message: string;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
}) {
  const [pending, setPending] = useState(false);
  return (
    <Modal title={title} onClose={onCancel}>
      <div className="space-y-(--space-4)">
        <div className="rounded-(--radius-sm) bg-danger-soft border border-danger px-(--space-3) py-(--space-3) text-[13px] font-semibold text-danger">
          {message}
        </div>
        <div className="flex justify-end gap-(--space-2)">
          <Button type="button" variant="ghost" onClick={onCancel}>
            إلغاء
          </Button>
          <Button
            type="button"
            variant="danger"
            disabled={pending}
            onClick={async () => {
              setPending(true);
              await onConfirm();
            }}
          >
            {pending ? "جارِ الحذف..." : "تأكيد الحذف"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
