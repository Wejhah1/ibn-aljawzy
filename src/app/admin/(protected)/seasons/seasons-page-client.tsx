"use client";

import { useState, useTransition } from "react";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SeasonWizard } from "./season-wizard";
import { setCurrentSeasonAction, archiveSeasonAction } from "./actions";
import { Plus, Calendar, Archive, CheckCircle2 } from "lucide-react";

interface Season {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: "current" | "archived";
  carry_over_points: boolean;
  weekly_off_days: number[];
}

export function SeasonsPageClient({ seasons, dayCounts }: { seasons: Season[]; dayCounts: Record<string, number> }) {
  const [wizardOpen, setWizardOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const hasCurrentSeason = seasons.some((s) => s.status === "current");

  return (
    <main className="p-(--space-4) md:p-(--space-8) max-w-[1000px] mx-auto">
      <div className="flex items-center justify-between mb-(--space-8)">
        <div>
          <h1 className="text-[22px] leading-[30px] font-bold text-ink">المواسم</h1>
          <p className="text-sm text-ink-muted mt-1">موسم واحد فقط يكون &quot;حالياً&quot; في أي وقت.</p>
        </div>
        <Button onClick={() => setWizardOpen(true)}>
          <Plus size={16} /> موسم جديد
        </Button>
      </div>

      <div className="space-y-(--space-3)">
        {seasons.length === 0 && (
          <Card>
            <CardDescription>لا توجد مواسم بعد. أنشئ أول موسم لبدء تسجيل الحضور والنقاط.</CardDescription>
          </Card>
        )}
        {seasons.map((s) => (
          <Card key={s.id} className={s.status === "current" ? "border-line-strong shadow-brutal-sm" : undefined}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-(--space-3)">
              <div>
                <div className="flex items-center gap-(--space-2) mb-1">
                  <CardTitle>{s.name}</CardTitle>
                  {s.status === "current" ? (
                    <Badge tone="success">
                      <CheckCircle2 size={12} /> الموسم الحالي
                    </Badge>
                  ) : (
                    <Badge tone="neutral">مؤرشف</Badge>
                  )}
                </div>
                <CardDescription className="flex items-center gap-(--space-3) flex-wrap">
                  <span className="flex items-center gap-1">
                    <Calendar size={13} />
                    {s.start_date} → {s.end_date}
                  </span>
                  <span>{dayCounts[s.id] ?? 0} يوم برنامج</span>
                  {s.carry_over_points && <span>ترحيل النقاط مفعّل</span>}
                </CardDescription>
              </div>
              <div className="flex items-center gap-(--space-2) shrink-0">
                {s.status !== "current" && (
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={pending}
                    onClick={() => startTransition(() => setCurrentSeasonAction(s.id))}
                  >
                    تعيين كحالي
                  </Button>
                )}
                {s.status === "current" && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pending}
                    onClick={() => startTransition(() => archiveSeasonAction(s.id))}
                  >
                    <Archive size={14} /> أرشفة
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {wizardOpen && <SeasonWizard onClose={() => setWizardOpen(false)} hasCurrentSeason={hasCurrentSeason} />}
    </main>
  );
}
