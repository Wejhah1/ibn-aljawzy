"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { BadgeStrip, type BadgeStripItem } from "@/components/badges/badge-strip";
import type { ProgramInfo } from "@/lib/settings";
import { Trophy, Medal, Users, CircleDot, ArrowRight, Play, Pause } from "lucide-react";

interface StudentEntry {
  studentId: string;
  fullName: string;
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

export function PublicLeaderboardClient({
  seasonName,
  entries,
  groupEntries,
  circleEntries,
  programInfo,
}: {
  seasonName: string | null;
  entries: StudentEntry[];
  groupEntries: GroupOrCircleEntry[];
  circleEntries: GroupOrCircleEntry[];
  programInfo: ProgramInfo;
}) {
  const [tab, setTab] = useState<TabKey>("points");
  const [rotating, setRotating] = useState(true);

  useEffect(() => {
    if (!rotating) return;
    const interval = setInterval(() => {
      setTab((prev) => {
        const idx = TABS.findIndex((t) => t.key === prev);
        return TABS[(idx + 1) % TABS.length].key;
      });
    }, 9000);
    return () => clearInterval(interval);
  }, [rotating]);

  const display = buildDisplayEntries(tab, entries, groupEntries, circleEntries);
  const top10 = display.slice(0, 10);
  const podium = top10.slice(0, 3);
  const rest = top10.slice(3);
  const currentTab = TABS.find((t) => t.key === tab)!;

  return (
    <main className="min-h-screen bg-surface p-(--space-4) md:p-(--space-8)">
      <div className="max-w-[900px] mx-auto">
        <div className="flex items-center justify-between flex-wrap gap-(--space-3) mb-(--space-6)">
          <div className="flex items-center gap-(--space-2)">
            <div className="flex h-9 w-9 items-center justify-center rounded-(--radius-sm) bg-surface-raised border-bold border-line-strong overflow-hidden p-0.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.svg" alt="" className="h-full w-full object-contain" />
            </div>
            <div>
              <h1 className="text-[20px] font-bold text-ink">المتصدرون</h1>
              <p className="text-[12px] text-ink-muted">
                {programInfo.program_name} {seasonName ? `· ${seasonName}` : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-(--space-2)">
            <button
              onClick={() => setRotating((r) => !r)}
              className="h-9 px-(--space-3) rounded-(--radius-sm) border border-line-strong bg-surface-raised text-[13px] font-bold text-ink-muted flex items-center gap-1.5 hover:bg-surface-sunken"
            >
              {rotating ? <Pause size={13} /> : <Play size={13} />} {rotating ? "إيقاف التدوير" : "تدوير تلقائي"}
            </button>
            <Link
              href="/"
              className="h-9 px-(--space-3) rounded-(--radius-sm) border border-line-strong bg-surface-raised text-[13px] font-bold text-ink-muted flex items-center gap-1.5 hover:bg-surface-sunken"
            >
              الرئيسية <ArrowRight size={13} />
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-(--space-2) mb-(--space-6) justify-center flex-wrap">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => {
                setTab(t.key);
                setRotating(false);
              }}
              className={`h-10 px-(--space-3) rounded-(--radius-sm) border-bold text-[13px] font-bold transition-colors flex items-center gap-1.5 ${
                tab === t.key
                  ? "bg-brand text-on-brand border-line-strong shadow-brutal-sm"
                  : "bg-surface-raised text-ink-muted border-line-strong hover:bg-surface-sunken"
              }`}
            >
              <t.icon size={13} /> {t.label}
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
            {podium.length > 0 && <Podium entries={podium} />}
            <div className="space-y-(--space-2)">
              {rest.map((e, i) => (
                <LeaderRow key={e.id} rank={i + 4} entry={e} />
              ))}
              {top10.length === 0 && <p className="text-center text-ink-muted text-sm py-(--space-8)">لا توجد بيانات بعد.</p>}
            </div>
          </motion.div>
        </AnimatePresence>
        <p className="text-[11px] text-ink-faint text-center mt-(--space-8)">{currentTab.label}</p>
      </div>
    </main>
  );
}

function Podium({ entries }: { entries: DisplayEntry[] }) {
  const [first, second, third] = entries;
  const heights = [160, 120, 90];

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
        transition={{ duration: 0.25, delay: (3 - rank) * 0.06 }}
        className="flex-1 flex flex-col items-center"
      >
        <div
          className="flex items-center justify-center rounded-full font-bold shrink-0 mb-(--space-2) h-11 w-11 text-base"
          style={{ backgroundColor: medalColor, color: "#171b18", border: "2.5px solid var(--color-line-strong)" }}
        >
          {rank}
        </div>
        <div className="flex items-center gap-1 mb-1">
          <p className="font-bold text-ink text-center leading-tight text-[12px]">{entry.title}</p>
          <BadgeStrip badges={entry.badges} max={2} />
        </div>
        <p className="font-bold text-brand mb-(--space-2) text-[11px]">{entry.valueLabel}</p>
        <div
          className="w-full rounded-t-(--radius-md) border-bold border-line-strong border-b-0 flex items-center justify-center"
          style={{ height, backgroundColor: podiumBg, boxShadow: "var(--shadow-brutal-sm)" }}
        >
          <Trophy size={18} style={{ color: entry.accent ?? medalColor }} />
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

function LeaderRow({ rank, entry }: { rank: number; entry: DisplayEntry }) {
  const isTop3 = rank <= 3;
  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.18, delay: rank * 0.02 }}
      className="flex items-center justify-between rounded-(--radius-md) border-bold px-(--space-4) py-(--space-3)"
      style={{
        borderColor: "var(--color-line-strong)",
        backgroundColor: isTop3 ? "var(--color-accent-soft)" : "var(--color-surface-raised)",
        boxShadow: isTop3 ? "var(--shadow-brutal-sm)" : undefined,
      }}
    >
      <div className="flex items-center gap-(--space-3)">
        <span
          className="flex items-center justify-center rounded-full font-bold h-9 w-9 text-sm"
          style={{
            backgroundColor: entry.accent ?? (isTop3 ? "var(--color-accent-solid)" : "var(--color-brand-soft)"),
            color: entry.accent ? "#fff" : isTop3 ? "var(--color-on-accent)" : "var(--color-brand-hover)",
          }}
        >
          {isTop3 ? <Medal size={16} /> : rank}
        </span>
        <div>
          <div className="flex items-center gap-1.5">
            <p className="font-bold text-ink text-sm">{entry.title}</p>
            <BadgeStrip badges={entry.badges} max={2} />
          </div>
          {entry.subtitle && <p className="text-ink-muted text-[12px]">{entry.subtitle}</p>}
        </div>
      </div>
      <Badge tone={isTop3 ? "accent" : "brand"}>
        <Trophy size={12} /> {entry.valueLabel}
      </Badge>
    </motion.div>
  );
}
