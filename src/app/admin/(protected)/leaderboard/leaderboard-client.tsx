"use client";

import { useEffect, useRef, useState } from "react";
import { toPng } from "html-to-image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ProgramInfo } from "@/lib/settings";
import { Trophy, Maximize2, Minimize2, Download, Play, Pause, Medal } from "lucide-react";

interface Entry {
  studentId: string;
  fullName: string;
  code: string;
  circleName: string | null;
  points: number;
  attendanceRate: number;
  achievementsCount: number;
}

type TabKey = "points" | "attendance" | "achievements";

const TABS: { key: TabKey; label: string }[] = [
  { key: "points", label: "الأعلى نقاطاً" },
  { key: "attendance", label: "الأفضل حضوراً" },
  { key: "achievements", label: "الأكثر إنجازاً" },
];

function sortEntries(entries: Entry[], tab: TabKey) {
  const copy = [...entries];
  if (tab === "points") return copy.sort((a, b) => b.points - a.points);
  if (tab === "attendance") return copy.sort((a, b) => b.attendanceRate - a.attendanceRate);
  return copy.sort((a, b) => b.achievementsCount - a.achievementsCount);
}

function valueFor(e: Entry, tab: TabKey) {
  if (tab === "points") return `${e.points} نقطة`;
  if (tab === "attendance") return `${e.attendanceRate}%`;
  return `${e.achievementsCount} إنجاز`;
}

export function LeaderboardClient({
  seasonName,
  entries,
  programInfo,
}: {
  seasonName: string;
  entries: Entry[];
  programInfo: ProgramInfo;
}) {
  const [tab, setTab] = useState<TabKey>("points");
  const [fullscreen, setFullscreen] = useState(false);
  const [rotating, setRotating] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!rotating) return;
    const interval = setInterval(() => {
      setTab((prev) => {
        const idx = TABS.findIndex((t) => t.key === prev);
        return TABS[(idx + 1) % TABS.length].key;
      });
    }, 8000);
    return () => clearInterval(interval);
  }, [rotating]);

  const sorted = sortEntries(entries, tab);
  const top10 = sorted.slice(0, 10);
  const podium = top10.slice(0, 3);
  const rest = top10.slice(3);

  const handleExport = async () => {
    if (!exportRef.current) return;
    const dataUrl = await toPng(exportRef.current, { pixelRatio: 2, backgroundColor: "#f7f7f3" });
    const link = document.createElement("a");
    link.download = `المتصدرون-${TABS.find((t) => t.key === tab)?.label}.png`;
    link.href = dataUrl;
    link.click();
  };

  const content = (
    <div
      className={
        fullscreen
          ? "fixed inset-0 z-50 min-h-screen flex flex-col items-center justify-center bg-surface p-(--space-8) overflow-y-auto"
          : "p-(--space-4) md:p-(--space-8) max-w-[900px] mx-auto"
      }
    >
      {!fullscreen && (
        <div className="flex items-center justify-between flex-wrap gap-(--space-3) mb-(--space-6)">
          <div>
            <h1 className="text-[22px] leading-[30px] font-bold text-ink">المتصدرون</h1>
            <p className="text-sm text-ink-muted mt-1">{seasonName}</p>
          </div>
          <div className="flex items-center gap-(--space-2)">
            <Button size="sm" variant="outline" onClick={handleExport}>
              <Download size={14} /> تصدير كصورة
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setFullscreen(true)}>
              <Maximize2 size={14} /> ملء الشاشة
            </Button>
          </div>
        </div>
      )}

      {fullscreen && (
        <div className="fixed top-4 left-4 z-50 flex items-center gap-(--space-2)">
          <Button size="sm" variant="secondary" onClick={() => setRotating((r) => !r)}>
            {rotating ? <Pause size={14} /> : <Play size={14} />} {rotating ? "إيقاف التدوير" : "تدوير تلقائي"}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setFullscreen(false)}>
            <Minimize2 size={14} /> خروج
          </Button>
        </div>
      )}

      <div className={fullscreen ? "w-full max-w-[900px]" : ""}>
        <div className="flex items-center gap-(--space-2) mb-(--space-6) justify-center flex-wrap">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`h-11 px-(--space-4) rounded-(--radius-sm) border-bold text-sm font-bold transition-colors ${
                tab === t.key
                  ? "bg-brand text-on-brand border-line-strong shadow-brutal-sm"
                  : "bg-surface-raised text-ink-muted border-line-strong hover:bg-surface-sunken"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {podium.length > 0 && <Podium entries={podium} tab={tab} large={fullscreen} />}

        <div className="space-y-(--space-2)">
          {rest.map((e, i) => (
            <LeaderRow key={e.studentId} rank={i + 4} entry={e} value={valueFor(e, tab)} large={fullscreen} />
          ))}
          {top10.length === 0 && <p className="text-center text-ink-muted text-sm">لا توجد بيانات بعد.</p>}
        </div>
      </div>

      {/* لوحة التصدير المخفية — مقاس ثابت مصمم للتصدير كصورة، منفصلة عن واجهة العرض */}
      <div className="fixed -left-[9999px] top-0">
        <div
          ref={exportRef}
          style={{ width: 1080, padding: 60 }}
          className="bg-surface flex flex-col"
        >
          <div className="flex items-center justify-between mb-10">
            <div>
              <p className="text-[42px] font-bold text-ink">المتصدرون</p>
              <p className="text-[22px] text-ink-muted font-medium mt-1">
                {programInfo.program_name} · {seasonName}
              </p>
            </div>
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-brand text-on-brand text-4xl font-bold border-[3px] border-ink shadow-[6px_6px_0_0_#171b18]">
              ا
            </div>
          </div>
          <p className="text-[28px] font-bold text-brand mb-8">{TABS.find((t) => t.key === tab)?.label}</p>
          <div className="flex flex-col gap-4">
            {top10.map((e, i) => (
              <div
                key={e.studentId}
                className="flex items-center justify-between rounded-2xl border-[2px] border-ink px-8 py-5"
                style={{ backgroundColor: i < 3 ? "#fbf3e6" : "#ffffff" }}
              >
                <div className="flex items-center gap-6">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full text-[24px] font-bold border-[2px] border-ink bg-brand-soft text-brand-hover">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-[26px] font-bold text-ink">{e.fullName}</p>
                    {e.circleName && <p className="text-[18px] text-ink-muted">{e.circleName}</p>}
                  </div>
                </div>
                <p className="text-[30px] font-bold text-brand">{valueFor(e, tab)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return content;
}

function Podium({ entries, tab, large }: { entries: Entry[]; tab: TabKey; large: boolean }) {
  const [first, second, third] = entries;
  const heights = large ? [220, 170, 130] : [160, 120, 90];

  const slot = (entry: Entry | undefined, rank: 1 | 2 | 3, height: number) => {
    if (!entry) return <div className="flex-1" />;
    const medalColor = rank === 1 ? "#e6b400" : rank === 2 ? "#9aa0a6" : "#b3742e";
    return (
      <div key={entry.studentId} className="flex-1 flex flex-col items-center">
        <div
          className={`flex items-center justify-center rounded-full font-bold shrink-0 mb-(--space-2) ${
            large ? "h-16 w-16 text-2xl" : "h-11 w-11 text-base"
          }`}
          style={{ backgroundColor: medalColor, color: "#171b18", border: "2.5px solid var(--color-line-strong)" }}
        >
          {rank}
        </div>
        <p className={`font-bold text-ink text-center leading-tight mb-1 ${large ? "text-lg" : "text-[12px]"}`}>
          {entry.fullName}
        </p>
        <p className={`font-bold text-brand mb-(--space-2) ${large ? "text-base" : "text-[11px]"}`}>{valueFor(entry, tab)}</p>
        <div
          className="w-full rounded-t-(--radius-md) border-bold border-line-strong border-b-0 flex items-start justify-center pt-(--space-2)"
          style={{ height, backgroundColor: "var(--color-accent-soft)", boxShadow: "var(--shadow-brutal-sm)" }}
        >
          <Trophy size={large ? 26 : 18} className="text-accent" />
        </div>
      </div>
    );
  };

  return (
    <div className="flex items-end gap-(--space-2) mb-(--space-6) max-w-[560px] mx-auto">
      {slot(second, 2, heights[1])}
      {slot(first, 1, heights[0])}
      {slot(third, 3, heights[2])}
    </div>
  );
}

function LeaderRow({ rank, entry, value, large }: { rank: number; entry: Entry; value: string; large: boolean }) {
  const isTop3 = rank <= 3;
  return (
    <div
      className={`flex items-center justify-between rounded-(--radius-md) border-bold px-(--space-4) ${
        large ? "py-(--space-4)" : "py-(--space-3)"
      }`}
      style={{
        borderColor: "var(--color-line-strong)",
        backgroundColor: isTop3 ? "var(--color-accent-soft)" : "var(--color-surface-raised)",
        boxShadow: isTop3 ? "var(--shadow-brutal-sm)" : undefined,
      }}
    >
      <div className="flex items-center gap-(--space-3)">
        <span
          className={`flex items-center justify-center rounded-full font-bold ${large ? "h-12 w-12 text-lg" : "h-9 w-9 text-sm"}`}
          style={{
            backgroundColor: isTop3 ? "var(--color-accent-solid)" : "var(--color-brand-soft)",
            color: isTop3 ? "var(--color-on-accent)" : "var(--color-brand-hover)",
          }}
        >
          {isTop3 ? <Medal size={large ? 22 : 16} /> : rank}
        </span>
        <div>
          <p className={`font-bold text-ink ${large ? "text-xl" : "text-sm"}`}>{entry.fullName}</p>
          {entry.circleName && <p className={`text-ink-muted ${large ? "text-sm" : "text-[12px]"}`}>{entry.circleName}</p>}
        </div>
      </div>
      <Badge tone={isTop3 ? "accent" : "brand"} className={large ? "text-base px-4 py-2" : undefined}>
        <Trophy size={large ? 16 : 12} /> {value}
      </Badge>
    </div>
  );
}
