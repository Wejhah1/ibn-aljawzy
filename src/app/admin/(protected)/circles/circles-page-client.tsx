"use client";

import { useState } from "react";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Phone, Users, CircleDot } from "lucide-react";
import { CircleFormModal } from "./circle-form-modal";
import { GroupFormModal } from "./group-form-modal";

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
  is_active: boolean;
  groups: Group[];
}

const GROUP_TONE_STYLE: Record<string, { fg: string; bg: string }> = {
  "group-1": { fg: "var(--color-group-1-fg)", bg: "var(--color-group-1-bg)" },
  "group-2": { fg: "var(--color-group-2-fg)", bg: "var(--color-group-2-bg)" },
  "group-3": { fg: "var(--color-group-3-fg)", bg: "var(--color-group-3-bg)" },
  "group-4": { fg: "var(--color-group-4-fg)", bg: "var(--color-group-4-bg)" },
  "group-5": { fg: "var(--color-group-5-fg)", bg: "var(--color-group-5-bg)" },
  "group-6": { fg: "var(--color-group-6-fg)", bg: "var(--color-group-6-bg)" },
};

export function CirclesPageClient({
  circles,
  currentSeasonId,
  circleCounts,
  groupCounts,
}: {
  circles: Circle[];
  currentSeasonId: string | null;
  circleCounts: Record<string, number>;
  groupCounts: Record<string, number>;
}) {
  const [newCircleOpen, setNewCircleOpen] = useState(false);
  const [editCircle, setEditCircle] = useState<Circle | null>(null);
  const [newGroupFor, setNewGroupFor] = useState<Circle | null>(null);
  const [editGroup, setEditGroup] = useState<Group | null>(null);

  return (
    <main className="p-(--space-4) md:p-(--space-8) max-w-[1000px] mx-auto">
      <div className="flex items-center justify-between mb-(--space-8)">
        <div>
          <h1 className="text-[22px] leading-[30px] font-bold text-ink">الحلقات والمجموعات</h1>
          <p className="text-sm text-ink-muted mt-1">نظّم الطلاب في حلقات، وكل حلقة في مجموعات.</p>
        </div>
        <Button onClick={() => setNewCircleOpen(true)}>
          <Plus size={16} /> حلقة جديدة
        </Button>
      </div>

      <div className="space-y-(--space-4)">
        {circles.length === 0 && (
          <Card>
            <CardDescription>لا توجد حلقات بعد.</CardDescription>
          </Card>
        )}
        {circles.map((circle) => (
          <Card key={circle.id}>
            <div className="flex items-start justify-between mb-(--space-4)">
              <div className="flex items-center gap-(--space-3)">
                <div className="flex h-10 w-10 items-center justify-center rounded-(--radius-sm) bg-brand-soft text-brand-hover">
                  <CircleDot size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-(--space-2)">
                    <CardTitle>{circle.name}</CardTitle>
                    <Badge tone="neutral">{circleCounts[circle.id] ?? 0} طالب</Badge>
                  </div>
                  {circle.leader_name && (
                    <CardDescription className="flex items-center gap-1 mt-1">
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
              <div className="flex items-center gap-(--space-2)">
                <Button size="sm" variant="outline" onClick={() => setEditCircle(circle)}>
                  <Pencil size={14} /> تعديل
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setNewGroupFor(circle)}>
                  <Plus size={14} /> مجموعة
                </Button>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-(--space-2)">
              {circle.groups.map((group) => {
                const tone = GROUP_TONE_STYLE[group.color_token] ?? GROUP_TONE_STYLE["group-1"];
                return (
                  <div
                    key={group.id}
                    className="flex items-center justify-between rounded-(--radius-sm) border border-line px-(--space-3) py-(--space-2)"
                  >
                    <div className="flex items-center gap-(--space-2)">
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: tone.fg }}
                      />
                      <div>
                        <p className="text-sm font-semibold text-ink">{group.name}</p>
                        {group.leader_name && <p className="text-[12px] text-ink-muted">{group.leader_name}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-(--space-2)">
                      <Badge tone="neutral">{groupCounts[group.id] ?? 0}</Badge>
                      <button
                        onClick={() => setEditGroup(group)}
                        className="flex h-8 w-8 items-center justify-center rounded-(--radius-xs) text-ink-muted hover:bg-surface-sunken hover:text-ink"
                      >
                        <Pencil size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
              {circle.groups.length === 0 && (
                <p className="text-[13px] text-ink-faint col-span-2">لا توجد مجموعات في هذه الحلقة بعد.</p>
              )}
            </div>
          </Card>
        ))}
      </div>

      {newCircleOpen && <CircleFormModal seasonId={currentSeasonId} onClose={() => setNewCircleOpen(false)} />}
      {editCircle && <CircleFormModal circle={editCircle} onClose={() => setEditCircle(null)} />}
      {newGroupFor && (
        <GroupFormModal circleId={newGroupFor.id} existingCount={newGroupFor.groups.length} onClose={() => setNewGroupFor(null)} />
      )}
      {editGroup && <GroupFormModal group={editGroup} onClose={() => setEditGroup(null)} />}
    </main>
  );
}
