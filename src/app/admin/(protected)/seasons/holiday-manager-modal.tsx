"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getProgramDaysAction, toggleHolidayAction, markHolidayRangeAction, type ProgramDay } from "./actions";
import { CalendarOff, CalendarCheck, Loader2 } from "lucide-react";

export function HolidayManagerModal({
  seasonId,
  seasonName,
  startDate,
  endDate,
  onClose,
}: {
  seasonId: string;
  seasonName: string;
  startDate: string;
  endDate: string;
  onClose: () => void;
}) {
  const [days, setDays] = useState<ProgramDay[] | null>(null);
  const [rangeStart, setRangeStart] = useState("");
  const [rangeEnd, setRangeEnd] = useState("");
  const [rangeNote, setRangeNote] = useState("");
  const [rangePending, setRangePending] = useState(false);
  const [rangeMessage, setRangeMessage] = useState<string | null>(null);

  const load = async () => {
    const data = await getProgramDaysAction(seasonId);
    setDays(data);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seasonId]);

  const submitRange = async () => {
    setRangePending(true);
    setRangeMessage(null);
    const res = await markHolidayRangeAction(seasonId, rangeStart, rangeEnd, rangeNote);
    if (res.error) {
      setRangeMessage(res.error);
    } else {
      setRangeMessage(`تم تعليم ${res.count ?? 0} يوم كعطلة.`);
      setRangeStart("");
      setRangeEnd("");
      setRangeNote("");
      await load();
    }
    setRangePending(false);
  };

  const toggleDay = async (day: ProgramDay) => {
    setDays((prev) => prev?.map((d) => (d.id === day.id ? { ...d, is_holiday: !d.is_holiday } : d)) ?? prev);
    await toggleHolidayAction(day.id, !day.is_holiday);
  };

  return (
    <Modal title={`إدارة الأيام والعطل — ${seasonName}`} onClose={onClose} maxWidth="640px">
      <div className="space-y-(--space-5)">
        <div className="rounded-(--radius-md) border-bold border-line-strong bg-surface-sunken p-(--space-4)">
          <p className="text-[13px] font-bold text-ink mb-(--space-3) flex items-center gap-2">
            <CalendarOff size={15} className="text-danger" /> تعليم عطلة مفاجئة (مثل إجازة اليوم الوطني أو إجازة مطوّلة)
          </p>
          <div className="grid sm:grid-cols-2 gap-(--space-3)">
            <div>
              <Label htmlFor="range_start">من تاريخ</Label>
              <Input
                id="range_start"
                type="date"
                min={startDate}
                max={endDate}
                value={rangeStart}
                onChange={(e) => setRangeStart(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="range_end">إلى تاريخ</Label>
              <Input
                id="range_end"
                type="date"
                min={startDate}
                max={endDate}
                value={rangeEnd}
                onChange={(e) => setRangeEnd(e.target.value)}
              />
            </div>
          </div>
          <div className="mt-(--space-3)">
            <Label htmlFor="range_note">سبب العطلة (اختياري)</Label>
            <Input id="range_note" value={rangeNote} onChange={(e) => setRangeNote(e.target.value)} placeholder="اليوم الوطني" />
          </div>
          {rangeMessage && <p className="text-[12px] font-semibold text-brand mt-(--space-2)">{rangeMessage}</p>}
          <div className="flex justify-end mt-(--space-3)">
            <Button size="sm" disabled={!rangeStart || !rangeEnd || rangePending} onClick={submitRange}>
              {rangePending ? <Loader2 size={14} className="animate-spin" /> : <CalendarOff size={14} />} تعليم كعطلة
            </Button>
          </div>
        </div>

        <div>
          <p className="text-[13px] font-bold text-ink mb-(--space-2)">كل أيام البرنامج ({days?.length ?? "..."})</p>
          <div className="space-y-1 max-h-[320px] overflow-y-auto rounded-(--radius-sm) border border-line">
            {!days && <p className="text-sm text-ink-muted p-(--space-4)">جارِ التحميل...</p>}
            {days?.map((d) => (
              <div
                key={d.id}
                className="flex items-center justify-between px-(--space-3) py-(--space-2) border-b border-line last:border-b-0"
              >
                <div className="flex items-center gap-(--space-2)">
                  <span className="text-sm font-semibold text-ink">
                    {new Date(d.day_date).toLocaleDateString("ar-SA", { weekday: "short", day: "numeric", month: "short" })}
                  </span>
                  {d.is_holiday && (
                    <Badge tone="danger">
                      <CalendarOff size={10} /> عطلة{d.note ? `: ${d.note}` : ""}
                    </Badge>
                  )}
                </div>
                <button
                  onClick={() => toggleDay(d)}
                  className={`flex items-center gap-1 h-8 px-3 rounded-(--radius-sm) border-bold text-[12px] font-bold ${
                    d.is_holiday
                      ? "bg-brand-soft border-brand text-brand-hover"
                      : "bg-danger-soft border-danger text-danger"
                  }`}
                >
                  {d.is_holiday ? (
                    <>
                      <CalendarCheck size={12} /> إلغاء العطلة
                    </>
                  ) : (
                    <>
                      <CalendarOff size={12} /> تعليم عطلة
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-(--space-2)">
          <Button variant="ghost" onClick={onClose}>
            تم
          </Button>
        </div>
      </div>
    </Modal>
  );
}
