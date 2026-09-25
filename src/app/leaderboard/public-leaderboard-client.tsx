"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { BadgeStrip, type BadgeStripItem } from "@/components/badges/badge-strip";
import { Avatar, shortName } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import type { ProgramInfo } from "@/lib/settings";
import { Trophy, Users, CircleDot, ArrowRight, Play, Pause, Star, CalendarCheck, Award, type LucideIcon } from "lucide-react";

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

const TABS: { key: TabKey; label: string; icon: LucideIcon }[] = [
  { key: "points", label: "النقاط", icon: Star },
  { key: "attendance", label: "الحضور", icon: CalendarCheck },
  { key: "achievements", label: "الإنجازات", icon: Award },
  { key: "groups", label: "المجموعات", icon: Users },
  { key: "circles", label: "الحلقات", icon: CircleDot },
];

const TAB_TITLES: Record<TabKey, string> = {
  points: "الأعلى نقاطاً",
  attendance: "الأفضل حضوراً",
  achievements: "الأكثر إنجازاً",
  groups: "أعلى المجموعات",
  circles: "أعلى الحلقات",
};

const ROTATE_MS = 9000;

const MEDALS: Record<1 | 2 | 3, { solid: string; soft: string; height: number }> = {
  1: { solid: "var(--color-medal-gold)", soft: "var(--color-medal-gold-soft)", height: 150 },
  2: { solid: "var(--color-medal-silver)", soft: "var(--color-medal-silver-soft)", height: 112 },
  3: { solid: "var(--color-medal-bronze)", soft: "var(--color-medal-bronze-soft)", height: 84 },
};

function tone(token: string) {
  return /^group-[1-6]$/.test(token) ? { fg: `var(--color-${token}-fg)`, bg: `var(--color-${token}-bg)` } : null;
}

interface DisplayEntry {
  id: string;
  title: string;
  subtitle: string | null;
  value: number;
  unit: string;
  badges: BadgeStripItem[];
  kind: "student" | "team";
  colorToken?: string;
}

function buildDisplayEntries(
  tab: TabKey,
  entries: StudentEntry[],
  groupEntries: GroupOrCircleEntry[],
  circleEntries: GroupOrCircleEntry[]
): DisplayEntry[] {
  if (tab === "groups" || tab === "circles") {
    const list = tab === "groups" ? groupEntries : circleEntries;
    return [...list]
      .sort((a, b) => b.points - a.points)
      .map((g) => ({ id: g.id, title: g.name, subtitle: null, value: g.points, unit: "نقطة", badges: [], kind: "team", colorToken: g.colorToken }));
  }
  const copy = [...entries];
  if (tab === "points") copy.sort((a, b) => b.points - a.points);
  else if (tab === "attendance") copy.sort((a, b) => b.attendanceRate - a.attendanceRate || b.points - a.points);
  else copy.sort((a, b) => b.achievementsCount - a.achievementsCount || b.points - a.points);

  return copy.map((e) => ({
    id: e.studentId,
    title: e.fullName,
    subtitle: e.circleName,
    value: tab === "points" ? e.points : tab === "attendance" ? e.attendanceRate : e.achievementsCount,
    unit: tab === "points" ? "نقطة" : tab === "attendance" ? "%" : "إنجاز",
    badges: e.badges,
    kind: "student",
  }));
}

function formatValue(e: DisplayEntry) {
  return e.unit === "%" ? `${e.value}%` : `${e.value} ${e.unit}`;
}

export function PublicLeaderboardClient({
  seasonName,
  entries,
  groupEntries,
  circleEntries,
  programInfo,
  tvMode = false,
  myStudentIds = [],
}: {
  seasonName: string | null;
  entries: StudentEntry[];
  groupEntries: GroupOrCircleEntry[];
  circleEntries: GroupOrCircleEntry[];
  programInfo: ProgramInfo;
  tvMode?: boolean;
  myStudentIds?: string[];
}) {
  const [tab, setTab] = useState<TabKey>("points");
  // التدوير التلقائي مخصص لشاشة العرض في المسجد (?tv=1)، ولا يُفعَّل تلقائياً على الجوال
  const [rotating, setRotating] = useState(tvMode);

  useEffect(() => {
    if (!rotating) return;
    const interval = setInterval(() => {
      setTab((prev) => {
        const idx = TABS.findIndex((t) => t.key === prev);
        return TABS[(idx + 1) % TABS.length].key;
      });
    }, ROTATE_MS);
    return () => clearInterval(interval);
  }, [rotating, tab]);

  const display = buildDisplayEntries(tab, entries, groupEntries, circleEntries);
  const top10 = display.slice(0, 10);
  const podium = top10.slice(0, 3);
  const rest = top10.slice(3);
  const mine = new Set(myStudentIds);
  const myOutside = display
    .map((e, i) => ({ entry: e, rank: i + 1 }))
    .filter(({ entry, rank }) => entry.kind === "student" && mine.has(entry.id) && rank > 10);

  return (
    <main className={`min-h-screen bg-surface px-(--space-4) pt-[calc(env(safe-area-inset-top)+16px)] pb-(--space-12) md:p-(--space-8) ${tvMode ? "md:text-lg" : ""}`}>
      <div className={`${tvMode ? "max-w-[1100px]" : "max-w-[760px]"} mx-auto`}>
        <div className="flex items-center justify-between gap-(--space-3) mb-(--space-5)">
          <div className="flex items-center gap-(--space-2) min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-(--radius-sm) bg-surface-raised border-bold border-line-strong overflow-hidden p-0.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.svg" alt="" className="h-full w-full object-contain" />
            </div>
            <div className="min-w-0">
              <h1 className={`${tvMode ? "text-[28px]" : "text-[20px]"} font-bold text-ink leading-tight`}>لوحة المتصدرين</h1>
              <p className="text-xs text-ink-muted truncate">
                {programInfo.program_name}
                {seasonName ? ` · ${seasonName}` : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-(--space-2) shrink-0">
            {tvMode && (
              <button
                onClick={() => setRotating((r) => !r)}
                aria-label={rotating ? "إيقاف التدوير" : "تشغيل التدوير"}
                className="h-10 px-(--space-3) rounded-(--radius-sm) border-bold border-line-strong bg-surface-raised text-[13px] font-bold text-ink-muted flex items-center gap-1.5 hover:bg-surface-sunken"
              >
                {rotating ? <Pause size={14} /> : <Play size={14} />}
                <span className="hidden sm:inline">{rotating ? "إيقاف التدوير" : "تدوير تلقائي"}</span>
              </button>
            )}
            {!tvMode && (
              <Link
                href="/"
                className="h-10 px-(--space-3) rounded-(--radius-sm) border-bold border-line-strong bg-surface-raised text-[13px] font-bold text-ink-muted flex items-center gap-1.5 hover:bg-surface-sunken"
              >
                <ArrowRight size={15} /> الرئيسية
              </Link>
            )}
          </div>
        </div>

        <div
          role="tablist"
          aria-label="تصنيفات اللوحة"
          className="flex items-center gap-(--space-2) mb-(--space-6) overflow-x-auto -mx-(--space-4) px-(--space-4) pb-1 md:justify-center md:mx-0 md:px-0 [scrollbar-width:none]"
        >
          {TABS.map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                role="tab"
                aria-selected={active}
                onClick={() => {
                  setTab(t.key);
                  setRotating(false);
                }}
                className={`relative shrink-0 h-10 px-(--space-4) rounded-full border-bold border-line-strong text-[13px] font-bold flex items-center gap-1.5 transition-colors ${
                  active ? "text-surface" : "bg-surface-raised text-ink-muted hover:bg-surface-sunken"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="leaderboard-tab"
                    className="absolute inset-0 rounded-full bg-ink shadow-brutal-sm"
                    transition={{ type: "spring", stiffness: 500, damping: 38 }}
                  />
                )}
                <t.icon size={14} className="relative" />
                <span className="relative">{t.label}</span>
              </button>
            );
          })}
        </div>

        {rotating && (
          <div className="h-1 rounded-full bg-surface-sunken overflow-hidden mb-(--space-4) max-w-[240px] mx-auto">
            <motion.div
              key={tab}
              className="h-full bg-brand"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: ROTATE_MS / 1000, ease: "linear" }}
            />
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22, ease: [0.2, 0, 0, 1] }}
          >
            <h2 className="text-center text-sm font-bold text-ink-muted mb-(--space-4)">{TAB_TITLES[tab]}</h2>
            {top10.length === 0 ? (
              <EmptyState icon={Trophy} title="لا توجد بيانات بعد" description="تظهر الترتيبات هنا بعد بدء تسجيل النقاط والحضور في الموسم." />
            ) : (
              <>
                <Podium entries={podium} mine={mine} tvMode={tvMode} />
                <div className="space-y-(--space-2)">
                  {rest.map((e, i) => (
                    <LeaderRow key={e.id} rank={i + 4} entry={e} isMine={mine.has(e.id)} />
                  ))}
                </div>
              </>
            )}
            {myOutside.length > 0 && (
              <div className="mt-(--space-5) space-y-(--space-2)">
                <p className="text-xs font-bold text-ink-muted text-center">ترتيب ابنك</p>
                {myOutside.map(({ entry, rank }) => (
                  <LeaderRow key={entry.id} rank={rank} entry={entry} isMine gap={display[rank - 2] ? display[rank - 2].value - entry.value : null} />
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  );
}

function EntryAvatar({ entry, size }: { entry: DisplayEntry; size: number }) {
  if (entry.kind === "student") return <Avatar name={entry.title} size={size} bordered />;
  const t = entry.colorToken ? tone(entry.colorToken) : null;
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full border-bold border-line-strong"
      style={{ width: size, height: size, backgroundColor: t?.bg ?? "var(--color-surface-sunken)", color: t?.fg ?? "var(--color-ink-muted)" }}
      aria-hidden
    >
      <Users size={Math.round(size * 0.45)} />
    </span>
  );
}

function Podium({ entries, mine, tvMode }: { entries: DisplayEntry[]; mine: Set<string>; tvMode: boolean }) {
  const [first, second, third] = entries;

  const slot = (entry: DisplayEntry | undefined, rank: 1 | 2 | 3) => {
    if (!entry) return <div className="flex-1" />;
    const medal = MEDALS[rank];
    const scale = tvMode ? 1.25 : 1;
    return (
      <motion.div
        key={entry.id}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 22, delay: (3 - rank) * 0.08 }}
        className="flex-1 flex flex-col items-center min-w-0"
      >
        <div className="relative mb-1.5">
          {rank === 1 && (
            <motion.span
              className="absolute -top-5 left-1/2 -translate-x-1/2 text-[20px]"
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 12, delay: 0.35 }}
              aria-hidden
            >
              👑
            </motion.span>
          )}
          <EntryAvatar entry={entry} size={Math.round((rank === 1 ? 60 : 50) * scale)} />
        </div>
        <p className={`font-bold text-ink text-center leading-tight line-clamp-2 px-0.5 ${tvMode ? "text-base" : "text-[13px]"}`}>
          {entry.kind === "student" ? shortName(entry.title) : entry.title}
        </p>
        {mine.has(entry.id) && <span className="mt-0.5 rounded-full bg-brand text-on-brand px-2 text-xs font-bold">ابنك</span>}
        <div className="flex items-center gap-1 mt-0.5 mb-(--space-2)">
          <p className="font-bold text-brand text-xs tabular-nums">{formatValue(entry)}</p>
          <BadgeStrip badges={entry.badges} max={2} />
        </div>
        <motion.div
          className="w-full rounded-t-(--radius-md) border-bold border-line-strong border-b-0 flex items-start justify-center pt-(--space-2)"
          style={{ backgroundColor: medal.soft, boxShadow: "var(--shadow-brutal-sm)" }}
          initial={{ height: 0 }}
          animate={{ height: medal.height * scale }}
          transition={{ duration: 0.5, ease: [0.2, 0, 0, 1], delay: 0.1 + (3 - rank) * 0.08 }}
        >
          <span
            className="flex h-9 w-9 items-center justify-center rounded-full border-bold border-line-strong text-base font-bold text-ink"
            style={{ backgroundColor: medal.solid }}
          >
            {rank}
          </span>
        </motion.div>
      </motion.div>
    );
  };

  return (
    <div className="mb-(--space-6) max-w-[520px] mx-auto">
      <div className="flex items-end gap-(--space-2) pt-(--space-5)">
        {slot(second, 2)}
        {slot(first, 1)}
        {slot(third, 3)}
      </div>
      <div className="h-[3px] rounded-full bg-line-strong" />
    </div>
  );
}

function LeaderRow({ rank, entry, isMine, gap = null }: { rank: number; entry: DisplayEntry; isMine: boolean; gap?: number | null }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, delay: Math.min(rank, 10) * 0.025 }}
      className={`flex items-center gap-(--space-3) rounded-(--radius-md) border-bold px-(--space-3) py-(--space-2) min-h-[60px] ${
        isMine ? "bg-brand-soft border-line-strong shadow-brutal-sm" : "bg-surface-raised border-line"
      }`}
    >
      <span className="w-7 shrink-0 text-center text-sm font-bold text-ink-muted tabular-nums">{rank}</span>
      <EntryAvatar entry={entry} size={38} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="font-bold text-ink text-sm truncate">{entry.kind === "student" ? shortName(entry.title) : entry.title}</p>
          {isMine && <span className="shrink-0 rounded-full bg-brand text-on-brand px-2 text-xs font-bold">ابنك</span>}
          <BadgeStrip badges={entry.badges} max={2} />
        </div>
        {(entry.subtitle || gap !== null) && (
          <p className="text-ink-muted text-xs truncate">
            {gap !== null && gap > 0 ? `يحتاج ${formatValue({ ...entry, value: gap })} ليصل إلى المركز ${rank - 1}` : entry.subtitle}
          </p>
        )}
      </div>
      <span className="shrink-0 rounded-(--radius-xs) bg-brand-soft text-brand-hover px-(--space-2) py-1 text-[13px] font-bold tabular-nums">
        {formatValue(entry)}
      </span>
    </motion.div>
  );
}
