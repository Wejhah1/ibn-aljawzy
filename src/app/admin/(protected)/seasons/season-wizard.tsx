"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { createSeasonAction, type SeasonActionState } from "./actions";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight, Check } from "lucide-react";

const WEEK_DAYS = [
  { value: 0, label: "الأحد" },
  { value: 1, label: "الاثنين" },
  { value: 2, label: "الثلاثاء" },
  { value: 3, label: "الأربعاء" },
  { value: 4, label: "الخميس" },
  { value: 5, label: "الجمعة" },
  { value: 6, label: "السبت" },
];

export function SeasonWizard({ onClose, hasCurrentSeason }: { onClose: () => void; hasCurrentSeason: boolean }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [offDays, setOffDays] = useState<number[]>([5]); // الجمعة افتراضياً
  const [carryOver, setCarryOver] = useState(false);
  const [carryCircles, setCarryCircles] = useState(false);
  const [carryGroups, setCarryGroups] = useState(false);
  const [setCurrent, setSetCurrent] = useState(!hasCurrentSeason);

  const [state, formAction, pending] = useActionState<SeasonActionState, FormData>(
    createSeasonAction,
    null
  );

  const preview = useMemo(() => {
    if (!startDate || !endDate) return null;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end <= start) return null;
    let total = 0;
    let programDays = 0;
    const cursor = new Date(start);
    while (cursor <= end) {
      total++;
      if (!offDays.includes(cursor.getDay())) programDays++;
      cursor.setDate(cursor.getDate() + 1);
    }
    return { total, programDays, offCount: total - programDays };
  }, [startDate, endDate, offDays]);

  const toggleOffDay = (d: number) => {
    setOffDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  };

  const canNextFrom0 = name.trim().length > 0 && !!startDate && !!endDate && new Date(endDate) > new Date(startDate);

  useEffect(() => {
    if (state?.success) onClose();
  }, [state, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-ink/40 p-0 md:p-(--space-6)">
      <Card className="w-full md:max-w-[560px] max-h-[92vh] overflow-y-auto rounded-b-none md:rounded-(--radius-lg) shadow-brutal">
        <div className="flex items-center justify-between mb-(--space-4)">
          <CardTitle>معالج إنشاء موسم جديد</CardTitle>
          <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-(--radius-sm) hover:bg-surface-sunken">
            <X size={18} />
          </button>
        </div>

        <div className="flex items-center gap-2 mb-(--space-6)">
          {["الاسم والفترة", "أيام الإجازة", "المعاينة والتأكيد"].map((label, i) => (
            <div key={i} className="flex-1 flex items-center gap-2">
              <div
                className={`h-7 w-7 shrink-0 rounded-full flex items-center justify-center text-[12px] font-bold ${
                  i <= step ? "bg-brand text-on-brand" : "bg-surface-sunken text-ink-faint"
                }`}
              >
                {i < step ? <Check size={14} /> : i + 1}
              </div>
              <span className={`text-[12px] font-semibold hidden sm:inline ${i <= step ? "text-ink" : "text-ink-faint"}`}>
                {label}
              </span>
            </div>
          ))}
        </div>

        <form action={formAction}>
          <input type="hidden" name="name" value={name} />
          <input type="hidden" name="start_date" value={startDate} />
          <input type="hidden" name="end_date" value={endDate} />
          {offDays.map((d) => (
            <input key={d} type="hidden" name="weekly_off_days" value={d} />
          ))}
          {carryOver && <input type="hidden" name="carry_over_points" value="on" />}
          {carryCircles && <input type="hidden" name="carry_circles" value="on" />}
          {carryGroups && <input type="hidden" name="carry_groups" value="on" />}
          {setCurrent && <input type="hidden" name="set_as_current" value="on" />}

          {step === 0 && (
            <div className="space-y-(--space-4)">
              <div>
                <Label htmlFor="name">اسم الموسم</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال: الموسم الصيفي 1447هـ" />
              </div>
              <div className="grid grid-cols-2 gap-(--space-3)">
                <div>
                  <Label htmlFor="start_date">تاريخ البداية</Label>
                  <Input id="start_date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="end_date">تاريخ النهاية</Label>
                  <Input id="end_date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-(--space-4)">
              <CardDescription>حدّد الأيام التي لا يعمل بها البرنامج أسبوعياً (لن تُنشأ أيام حضور لها).</CardDescription>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-(--space-2)">
                {WEEK_DAYS.map((d) => (
                  <button
                    type="button"
                    key={d.value}
                    onClick={() => toggleOffDay(d.value)}
                    className={`h-11 rounded-(--radius-sm) border-bold text-sm font-semibold transition-colors ${
                      offDays.includes(d.value)
                        ? "bg-danger-soft border-danger text-danger"
                        : "bg-surface-raised border-line-strong text-ink hover:bg-surface-sunken"
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
              <label className="flex items-center gap-(--space-2) text-sm font-semibold text-ink pt-(--space-2)">
                <input type="checkbox" checked={carryOver} onChange={(e) => setCarryOver(e.target.checked)} className="h-5 w-5" />
                ترحيل نقاط الطلاب من الموسم السابق
              </label>
              <label className="flex items-center gap-(--space-2) text-sm font-semibold text-ink">
                <input type="checkbox" checked={carryCircles} onChange={(e) => setCarryCircles(e.target.checked)} className="h-5 w-5" />
                ترحيل الحلقات (إنشاء نفس حلقات الطلاب في الموسم الجديد ووضعهم فيها)
              </label>
              <label className="flex items-center gap-(--space-2) text-sm font-semibold text-ink">
                <input type="checkbox" checked={carryGroups} onChange={(e) => setCarryGroups(e.target.checked)} className="h-5 w-5" />
                ترحيل المجموعات (يبقى كل طالب في مجموعته الحالية)
              </label>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-(--space-4)">
              <div className="rounded-(--radius-md) border-bold border-line-strong bg-surface-sunken p-(--space-4)">
                <p className="text-sm font-bold text-ink mb-(--space-3)">{name}</p>
                <div className="grid grid-cols-3 gap-(--space-3) text-center">
                  <div>
                    <p className="text-[24px] font-bold text-brand">{preview?.programDays ?? 0}</p>
                    <p className="text-xs text-ink-muted font-medium">يوم برنامج</p>
                  </div>
                  <div>
                    <p className="text-[24px] font-bold text-ink">{preview?.total ?? 0}</p>
                    <p className="text-xs text-ink-muted font-medium">إجمالي الأيام</p>
                  </div>
                  <div>
                    <p className="text-[24px] font-bold text-ink-muted">{preview?.offCount ?? 0}</p>
                    <p className="text-xs text-ink-muted font-medium">أيام إجازة</p>
                  </div>
                </div>
              </div>
              <label className="flex items-center gap-(--space-2) text-sm font-semibold text-ink">
                <input type="checkbox" checked={setCurrent} onChange={(e) => setSetCurrent(e.target.checked)} className="h-5 w-5" />
                تفعيل هذا الموسم كـ&quot;الموسم الحالي&quot; فوراً
                {hasCurrentSeason && setCurrent && (
                  <span className="text-warning font-normal">(سيُؤرشف الموسم الحالي تلقائياً)</span>
                )}
              </label>
              {state?.error && <p className="text-[13px] font-semibold text-danger">{state.error}</p>}
            </div>
          )}

          <div className="flex items-center justify-between mt-(--space-6) pt-(--space-4) border-t border-line">
            <Button type="button" variant="ghost" onClick={() => (step === 0 ? onClose() : setStep(step - 1))}>
              <ChevronRight size={16} /> {step === 0 ? "إلغاء" : "السابق"}
            </Button>
            {step < 2 ? (
              <Button type="button" onClick={() => setStep(step + 1)} disabled={step === 0 && !canNextFrom0}>
                التالي <ChevronLeft size={16} />
              </Button>
            ) : (
              <Button type="submit" disabled={pending}>
                {pending ? "جارِ الإنشاء..." : "تأكيد إنشاء الموسم"}
              </Button>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
}
