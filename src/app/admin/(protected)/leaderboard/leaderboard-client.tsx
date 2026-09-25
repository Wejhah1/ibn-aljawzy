"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toPng } from "html-to-image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BadgeStrip, type BadgeStripItem } from "@/components/badges/badge-strip";
import type { ProgramInfo } from "@/lib/settings";
import { Trophy, Maximize2, Minimize2, Download, Play, Pause, Medal, Users, CircleDot } from "lucide-react";

interface StudentEntry {
  studentId: string;
  fullName: string;
  code: string;
  circleName: string | null;
  points: number;
  attendanceRate: number;
  achievementsCount: number;
  badges: BadgeStripItem[];
}

interface GroupOrCircleEntry {
  id: string;
  name: string;
  colorToken: string;
  points: number;
}

type TabKey = "points" | "attendance" | "achievements" | "groups" | "circles";

const TABS: { key: TabKey; label: string; icon: typeof Trophy }[] = [
  { key: "points", label: "الأعلى نقاطاً", icon: Trophy },
  { key: "attendance", label: "الأفضل حضوراً", icon: Trophy },
  { key: "achievements", label: "الأكثر إنجازاً", icon: Trophy },
  { key: "groups", label: "أعلى المجموعات", icon: Users },
  { key: "circles", label: "أعلى الحلقات", icon: CircleDot },
];

const TONE: Record<string, string> = {
  "group-1": "var(--color-group-1-fg)",
  "group-2": "var(--color-group-2-fg)",
  "group-3": "var(--color-group-3-fg)",
  "group-4": "var(--color-group-4-fg)",
  "group-5": "var(--color-group-5-fg)",
  "group-6": "var(--color-group-6-fg)",
};

interface DisplayEntry {
  id: string;
  title: string;
  subtitle: string | null;
  valueLabel: string;
  badges: BadgeStripItem[];
  accent?: string;
}

function buildDisplayEntries(
  tab: TabKey,
  entries: StudentEntry[],
  groupEntries: GroupOrCircleEntry[],
  circleEntries: GroupOrCircleEntry[]
): DisplayEntry[] {
  if (tab === "groups") {
    return [...groupEntries]
      .sort((a, b) => b.points - a.points)
      .map((g) => ({ id: g.id, title: g.name, subtitle: "مجموعة", valueLabel: `${g.points} نقطة`, badges: [], accent: TONE[g.colorToken] }));
  }
  if (tab === "circles") {
    return [...circleEntries]
      .sort((a, b) => b.points - a.points)
      .map((c) => ({ id: c.id, title: c.name, subtitle: "حلقة", valueLabel: `${c.points} نقطة`, badges: [], accent: TONE[c.colorToken] }));
  }
  const copy = [...entries];
  if (tab === "points") copy.sort((a, b) => b.points - a.points);
  else if (tab === "attendance") copy.sort((a, b) => b.attendanceRate - a.attendanceRate);
  else copy.sort((a, b) => b.achievementsCount - a.achievementsCount);

  return copy.map((e) => ({
    id: e.studentId,
    title: e.fullName,
    subtitle: e.circleName,
    valueLabel: tab === "points" ? `${e.points} نقطة` : tab === "attendance" ? `${e.attendanceRate}%` : `${e.achievementsCount} إنجاز`,
    badges: e.badges,
  }));
}

export function LeaderboardClient({
  seasonName,
  entries,
  groupEntries,
  circleEntries,
  programInfo,
}: {
  seasonName: string;
  entries: StudentEntry[];
  groupEntries: GroupOrCircleEntry[];
  circleEntries: GroupOrCircleEntry[];
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

  const display = buildDisplayEntries(tab, entries, groupEntries, circleEntries);
  const top10 = display.slice(0, 10);
  const podium = top10.slice(0, 3);
  const rest = top10.slice(3);
  const currentTab = TABS.find((t) => t.key === tab)!;

  const handleExport = async () => {
    if (!exportRef.current) return;
    const dataUrl = await toPng(exportRef.current, { pixelRatio: 2, backgroundColor: "#f7f7f3" });
    const link = document.createElement("a");
    link.download = `المتصدرون-${currentTab.label}.png`;
    link.href = dataUrl;
    link.click();
  };

  return (
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
              className={`h-11 px-(--space-4) rounded-(--radius-sm) border-bold text-sm font-bold transition-colors flex items-center gap-1.5 ${
                tab === t.key
                  ? "bg-brand text-on-brand border-line-strong shadow-brutal-sm"
                  : "bg-surface-raised text-ink-muted border-line-strong hover:bg-surface-sunken"
              }`}
            >
              <t.icon size={14} /> {t.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22, ease: [0.2, 0, 0, 1] }}
          >
            {podium.length > 0 && <Podium entries={podium} large={fullscreen} />}

            <div className="space-y-(--space-2)">
              {rest.map((e, i) => (
                <LeaderRow key={e.id} rank={i + 4} entry={e} large={fullscreen} />
              ))}
              {top10.length === 0 && <p className="text-center text-ink-muted text-sm">لا توجد بيانات بعد.</p>}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* لوحة التصدير المخفية — مقاس ثابت مصمم للتصدير كصورة أو للعرض على شاشة، منفصلة عن واجهة العرض */}
      <div className="fixed -left-[9999px] top-0">
        <div ref={exportRef} style={{ width: 1080, padding: 60 }} className="bg-surface flex flex-col">
          <div className="flex items-center justify-between mb-10">
            <div>
              <p className="text-[42px] font-bold text-ink">المتصدرون</p>
              <p className="text-[22px] text-ink-muted font-medium mt-1">
                {programInfo.program_name} · {seasonName}
              </p>
            </div>
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-surface-raised border-[3px] border-ink shadow-[6px_6px_0_0_#171b18] overflow-hidden p-1.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.svg" alt="" className="h-full w-full object-contain" />
            </div>
          </div>
          <p className="text-[28px] font-bold text-brand mb-8">{currentTab.label}</p>
          <div className="flex flex-col gap-4">
            {top10.map((e, i) => {
              const medalColor = i === 0 ? "#e6b400" : i === 1 ? "#9aa0a6" : i === 2 ? "#b3742e" : null;
              return (
              <div
                key={e.id}
                className="flex items-center justify-between rounded-2xl border-[2px] border-ink px-8 py-5"
                style={{ backgroundColor: medalColor ? `${medalColor}26` : "#ffffff" }}
              >
                <div className="flex items-center gap-6">
                  <span
                    className={`flex h-14 w-14 items-center justify-center rounded-full text-[24px] font-bold border-[2px] border-ink ${
                      medalColor ? "" : "bg-brand-soft text-brand-hover"
                    }`}
                    style={medalColor ? { backgroundColor: medalColor, color: "#171b18" } : undefined}
                  >
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-[26px] font-bold text-ink">{e.title}</p>
                    {e.subtitle && <p className="text-[18px] text-ink-muted">{e.subtitle}</p>}
                  </div>
                </div>
                <p className="text-[30px] font-bold text-brand">{e.valueLabel}</p>
              </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function Podium({ entries, large }: { entries: DisplayEntry[]; large: boolean }) {
  const [first, second, third] = entries;
  const heights = large ? [220, 170, 130] : [160, 120, 90];

  const slot = (entry: DisplayEntry | undefined, rank: 1 | 2 | 3, height: number) => {
    if (!entry) return <div className="flex-1" />;
    const medalColor = rank === 1 ? "#e6b400" : rank === 2 ? "#9aa0a6" : "#b3742e";
    const podiumBg = entry.accent
      ? `${entry.accent}22`
      : rank === 1
        ? "#e6b40026"
        : rank === 2
          ? "#9aa0a626"
          : "#b3742e26";
    return (
      <motion.div
        key={entry.id}
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25, delay: (3 - rank) * 0.06, ease: [0.2, 0, 0, 1] }}
        className="flex-1 flex flex-col items-center"
      >
        <div
          className={`flex items-center justify-center rounded-full font-bold shrink-0 mb-(--space-2) ${
            large ? "h-16 w-16 text-2xl" : "h-11 w-11 text-base"
          }`}
          style={{ backgroundColor: medalColor, color: "#171b18", border: "2.5px solid var(--color-line-strong)" }}
        >
          {rank}
        </div>
        <div className="flex items-center gap-1 mb-1">
          <p className={`font-bold text-ink text-center leading-tight ${large ? "text-lg" : "text-[12px]"}`}>{entry.title}</p>
          <BadgeStrip badges={entry.badges} max={2} size={large ? "md" : "sm"} />
        </div>
        <p className={`font-bold text-brand mb-(--space-2) ${large ? "text-base" : "text-xs"}`}>{entry.valueLabel}</p>
        <div
          className="w-full rounded-t-(--radius-md) border-bold border-line-strong border-b-0 flex items-center justify-center"
          style={{ height, backgroundColor: podiumBg, boxShadow: "var(--shadow-brutal-sm)" }}
        >
          <Trophy size={large ? 26 : 18} style={{ color: entry.accent ?? medalColor }} />
        </div>
      </motion.div>
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

function LeaderRow({ rank, entry, large }: { rank: number; entry: DisplayEntry; large: boolean }) {
  const isTop3 = rank <= 3;
  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.18, delay: rank * 0.02, ease: [0.2, 0, 0, 1] }}
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
            backgroundColor: entry.accent ?? (isTop3 ? "var(--color-accent-solid)" : "var(--color-brand-soft)"),
            color: entry.accent ? "#fff" : isTop3 ? "var(--color-on-accent)" : "var(--color-brand-hover)",
          }}
        >
          {isTop3 ? <Medal size={large ? 22 : 16} /> : rank}
        </span>
        <div>
          <div className="flex items-center gap-1.5">
            <p className={`font-bold text-ink ${large ? "text-xl" : "text-sm"}`}>{entry.title}</p>
            <BadgeStrip badges={entry.badges} max={2} size={large ? "md" : "sm"} />
          </div>
          {entry.subtitle && <p className={`text-ink-muted ${large ? "text-sm" : "text-[12px]"}`}>{entry.subtitle}</p>}
        </div>
      </div>
      <Badge tone={isTop3 ? "accent" : "brand"} className={large ? "text-base px-4 py-2" : undefined}>
        <Trophy size={large ? 16 : 12} /> {entry.valueLabel}
      </Badge>
    </motion.div>
  );
}
