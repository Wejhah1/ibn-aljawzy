"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Avatar, shortName } from "@/components/ui/avatar";
import { GeometricPattern } from "@/components/ui/geometric-pattern";
import { formatDate, longDateFormat } from "@/lib/format";
import {
  Users,
  CircleDot,
  Calendar,
  BookOpen,
  Trophy,
  ShieldCheck,
  ArrowLeft,
  GraduationCap,
  Megaphone,
  Sparkles,
  Star,
  Hourglass,
  ChevronLeft,
} from "lucide-react";

interface PublicStats {
  season_name: string | null;
  season_start: string | null;
  season_end: string | null;
  total_active_students: number;
  total_circles: number;
}

interface HomepageContent {
  hero_title: string | null;
  hero_subtitle: string | null;
  logo_url: string | null;
}

interface NewsPost {
  id: string;
  title: string;
  body: string | null;
  image_url: string | null;
  category: string;
  published_at: string;
}

export interface TopStudent {
  id: string;
  fullName: string;
  circleName: string | null;
  points: number;
}

export interface SeasonProgress {
  totalDays: number;
  elapsedDays: number;
  started: boolean;
  ended: boolean;
}

const FEATURES = [
  { icon: BookOpen, title: "حفظ وتلاوة", desc: "برنامج يومي منظم لحفظ القرآن الكريم ومراجعته بإشراف معلمين مؤهلين." },
  { icon: Trophy, title: "نظام نقاط وحوافز", desc: "تحفيز مستمر للطلاب عبر النقاط والإنجازات والأوسمة على مدار الموسم." },
  { icon: ShieldCheck, title: "متابعة أولياء الأمور", desc: "بوابة خاصة لولي الأمر يتابع فيها حضور ابنه ونتائجه أولاً بأول." },
];

const NEWS_STYLES: Record<string, { icon: typeof GraduationCap; bg: string; soft: string; fg: string }> = {
  "إنجاز": { icon: GraduationCap, bg: "bg-info", soft: "bg-info-soft", fg: "text-info" },
  "فعالية": { icon: Sparkles, bg: "bg-accent-solid", soft: "bg-accent-soft", fg: "text-accent" },
  "إعلان": { icon: Megaphone, bg: "bg-brand", soft: "bg-brand-soft", fg: "text-brand" },
};
const DEFAULT_NEWS_STYLE = { icon: Megaphone, bg: "bg-brand", soft: "bg-brand-soft", fg: "text-brand" };

const MEDALS = [
  { bg: "var(--color-medal-gold)", soft: "var(--color-medal-gold-soft)", height: 76 },
  { bg: "var(--color-medal-silver)", soft: "var(--color-medal-silver-soft)", height: 54 },
  { bg: "var(--color-medal-bronze)", soft: "var(--color-medal-bronze-soft)", height: 40 },
];

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-40px" },
};

export function HomeClient({
  stats,
  content,
  news,
  topStudents,
  progress,
}: {
  stats: PublicStats;
  content: HomepageContent;
  news: NewsPost[];
  topStudents: TopStudent[];
  progress: SeasonProgress | null;
}) {
  const [openNews, setOpenNews] = useState<NewsPost | null>(null);
  const title = content.hero_title?.trim() || "حلقات ابن الجوزي";
  const subtitle =
    content.hero_subtitle?.trim() ||
    "برنامج تحفيظ صيفي بمسجد الطرباق، يجمع بين حفظ القرآن الكريم والتحفيز بنظام النقاط والمتابعة الدقيقة لأولياء الأمور طوال الموسم.";
  const logoSrc = content.logo_url || "/logo.svg";

  return (
    <main className="min-h-screen bg-surface overflow-x-hidden">
      <header className="sticky top-0 z-30 border-b border-line bg-surface/90 backdrop-blur pt-[env(safe-area-inset-top)]">
        <div className="max-w-[1100px] mx-auto px-(--space-4) h-16 flex items-center justify-between gap-(--space-3)">
          <Link href="/" className="flex items-center gap-(--space-2) min-w-0">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-(--radius-sm) bg-surface-raised border-bold border-line-strong overflow-hidden p-0.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logoSrc} alt="" className="h-full w-full object-contain" />
            </span>
            <span className="text-[15px] font-bold text-ink truncate">{title}</span>
          </Link>
          <Link href="/portal/login" className="shrink-0">
            <Button size="sm" variant="secondary">
              <ShieldCheck size={15} /> متابعة ابني
            </Button>
          </Link>
        </div>
      </header>

      {/* الواجهة */}
      <section className="relative px-(--space-4) pt-(--space-10) pb-(--space-10) md:pt-20 md:pb-16">
        <GeometricPattern className="absolute inset-0 h-full w-full text-brand opacity-[0.08]" size={64} />
        <div className="relative max-w-[760px] mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.85, rotate: -6 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 18 }}
            className="mx-auto mb-(--space-5) flex h-20 w-20 md:h-24 md:w-24 items-center justify-center rounded-(--radius-lg) bg-surface-raised border-brutal border-line-strong shadow-brutal overflow-hidden p-2"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoSrc} alt={title} className="h-full w-full object-contain" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="inline-flex items-center gap-2 rounded-full border-bold border-line-strong bg-surface-raised px-(--space-4) py-1.5 text-[13px] font-bold text-brand mb-(--space-4) shadow-brutal-sm"
          >
            <Calendar size={14} />
            {stats.season_name ? `الموسم الحالي: ${stats.season_name}` : "البرنامج الصيفي"}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="text-[32px] md:text-[48px] leading-[1.25] font-bold text-ink mb-(--space-4) text-balance"
          >
            {title}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.22 }}
            className="text-base md:text-lg leading-relaxed text-ink-muted mb-(--space-8) max-w-[560px] mx-auto text-pretty"
          >
            {subtitle}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-(--space-3) max-w-[360px] sm:max-w-none mx-auto"
          >
            <Link href="/portal/login">
              <Button size="lg" className="w-full">
                متابعة ابني <ArrowLeft size={17} />
              </Button>
            </Link>
            <Link href="/leaderboard">
              <Button size="lg" variant="secondary" className="w-full">
                <Trophy size={17} /> لوحة المتصدرين
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* أرقام الموسم */}
      <section className="px-(--space-4) pb-(--space-12)">
        <div className={`max-w-[860px] mx-auto grid gap-(--space-3) md:gap-(--space-4) ${progress ? "grid-cols-2 md:grid-cols-3" : "grid-cols-2"}`}>
          <StatTile icon={Users} value={stats.total_active_students} label="طالب مسجّل" delay={0} />
          <StatTile icon={CircleDot} value={stats.total_circles} label="حلقة تحفيظ" delay={0.08} />
          {progress && <ProgressTile progress={progress} />}
        </div>
      </section>

      {/* أبطال الموسم */}
      {topStudents.length > 0 && (
        <section className="px-(--space-4) pb-(--space-12)">
          <motion.div
            {...fadeUp}
            transition={{ duration: 0.5 }}
            className="max-w-[560px] mx-auto rounded-(--radius-lg) border-bold border-line-strong bg-surface-raised shadow-brutal p-(--space-5)"
          >
            <div className="flex items-center justify-between gap-(--space-3) mb-(--space-5)">
              <h2 className="flex items-center gap-2 text-[20px] font-bold text-ink">
                <Trophy size={20} className="text-accent" /> أبطال الموسم
              </h2>
              <Link href="/leaderboard" className="inline-flex items-center gap-0.5 h-9 text-[13px] font-bold text-brand hover:text-brand-hover">
                اللوحة كاملة <ChevronLeft size={16} />
              </Link>
            </div>
            <div className="flex items-end gap-(--space-2)">
              {[1, 0, 2].map((idx) => {
                const s = topStudents[idx];
                if (!s) return <div key={idx} className="flex-1" />;
                const m = MEDALS[idx];
                return (
                  <motion.div
                    key={s.id}
                    className="flex-1 flex flex-col items-center text-center min-w-0"
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ type: "spring", stiffness: 300, damping: 22, delay: 0.15 + (2 - idx) * 0.08 }}
                  >
                    <Avatar name={s.fullName} size={idx === 0 ? 52 : 44} bordered className="mb-1.5" />
                    <p className="text-[13px] font-bold text-ink leading-tight line-clamp-2 px-0.5">{shortName(s.fullName)}</p>
                    <p className="text-xs font-bold text-brand mt-0.5 mb-(--space-2) tabular-nums">{s.points} نقطة</p>
                    <div
                      className="w-full rounded-t-(--radius-sm) border-bold border-b-0 border-line-strong flex items-start justify-center pt-1.5 text-[18px] font-bold text-ink"
                      style={{ height: m.height, backgroundColor: m.soft }}
                    >
                      {idx + 1}
                    </div>
                  </motion.div>
                );
              })}
            </div>
            <div className="h-[3px] bg-line-strong rounded-full" />
          </motion.div>
        </section>
      )}

      {/* مميزات البرنامج */}
      <section className="px-(--space-4) pb-(--space-12) md:pb-20">
        <div className="max-w-[1000px] mx-auto">
          <motion.h2 {...fadeUp} className="text-[22px] md:text-[26px] font-bold text-ink text-center mb-(--space-6) md:mb-(--space-8)">
            لماذا حلقات ابن الجوزي؟
          </motion.h2>
          <div className="grid md:grid-cols-3 gap-(--space-3) md:gap-(--space-4)">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                {...fadeUp}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="flex md:block items-start gap-(--space-4) rounded-(--radius-lg) border-bold border-line-strong bg-surface-raised p-(--space-5) shadow-brutal-sm"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-(--radius-sm) bg-brand-soft text-brand-hover border-bold border-line-strong md:mb-(--space-4)">
                  <f.icon size={22} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-ink mb-1">{f.title}</h3>
                  <p className="text-sm text-ink-muted leading-relaxed">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {news.length > 0 && (
        <section className="pb-20">
          <div className="max-w-[1000px] mx-auto">
            <motion.h2 {...fadeUp} className="text-[22px] md:text-[26px] font-bold text-ink text-center mb-(--space-6) md:mb-(--space-8) px-(--space-4)">
              آخر الأخبار
            </motion.h2>
            {/* على الجوال: شريط أفقي يُسحب، وعلى الشاشات الكبيرة: شبكة */}
            <div className="flex md:grid md:grid-cols-3 gap-(--space-4) overflow-x-auto md:overflow-visible snap-x snap-mandatory px-(--space-4) pb-(--space-3) scroll-px-(--space-4) [scrollbar-width:none]">
              {news.map((n, i) => {
                const style = NEWS_STYLES[n.category] ?? DEFAULT_NEWS_STYLE;
                const Icon = style.icon;
                return (
                  <motion.button
                    type="button"
                    key={n.id}
                    onClick={() => setOpenNews(n)}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ duration: 0.5, delay: Math.min(i, 3) * 0.08, ease: [0.22, 1, 0.36, 1] }}
                    whileTap={{ x: 2, y: 2, boxShadow: "var(--shadow-brutal-press)" }}
                    className="group snap-start shrink-0 w-[80%] sm:w-[46%] md:w-auto text-right rounded-(--radius-lg) border-bold border-line-strong bg-surface-raised overflow-hidden shadow-brutal-sm hover:shadow-brutal transition-shadow flex flex-col"
                  >
                    {n.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={n.image_url}
                        alt=""
                        className="w-full h-40 object-cover border-b border-line-strong transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className={`relative h-28 w-full ${style.bg} flex items-center justify-center overflow-hidden border-b border-line-strong`}>
                        <GeometricPattern className="absolute inset-0 h-full w-full text-white opacity-20" size={40} />
                        <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                          <Icon size={22} className="text-white" />
                        </div>
                      </div>
                    )}
                    <div className="p-(--space-4) flex flex-col flex-1">
                      <span className={`self-start inline-flex items-center gap-1 rounded-full ${style.soft} ${style.fg} px-(--space-2) py-0.5 text-xs font-bold mb-(--space-2)`}>
                        <Star size={10} className="fill-current" />
                        {n.category}
                      </span>
                      <h3 className="text-[15px] font-bold text-ink mb-(--space-2) leading-snug">{n.title}</h3>
                      {n.body && <p className="text-sm text-ink-muted leading-relaxed line-clamp-3">{n.body}</p>}
                      <div className="mt-auto pt-(--space-3) flex items-center justify-between">
                        <span className="text-xs text-ink-faint">{formatDate(n.published_at, longDateFormat)}</span>
                        <span className="inline-flex items-center gap-0.5 text-xs font-bold text-brand">
                          اقرأ المزيد <ChevronLeft size={14} />
                        </span>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <footer className="border-t border-line py-(--space-8) px-(--space-4) pb-[calc(env(safe-area-inset-bottom)+32px)]">
        <div className="max-w-[1100px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-(--space-3) text-[13px] text-ink-muted">
          <p>© {new Date().getFullYear()} حلقات ابن الجوزي — مسجد الطرباق</p>
          <Link href="/admin/login" className="h-10 inline-flex items-center hover:text-ink">
            دخول فريق الإدارة
          </Link>
        </div>
      </footer>

      {openNews && (
        <Modal title={openNews.category} onClose={() => setOpenNews(null)} maxWidth="560px">
          {openNews.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={openNews.image_url} alt="" className="w-full max-h-64 object-cover rounded-(--radius-md) border-bold border-line-strong mb-(--space-4)" />
          )}
          <h3 className="text-[20px] font-bold text-ink leading-snug mb-1">{openNews.title}</h3>
          <p className="text-xs text-ink-faint mb-(--space-4)">{formatDate(openNews.published_at, longDateFormat)}</p>
          {openNews.body && <p className="text-[15px] leading-loose text-ink whitespace-pre-line">{openNews.body}</p>}
        </Modal>
      )}
    </main>
  );
}

function StatTile({ icon: Icon, value, label, delay }: { icon: typeof Users; value: number; label: string; delay: number }) {
  return (
    <motion.div
      {...fadeUp}
      transition={{ duration: 0.5, delay }}
      className="rounded-(--radius-md) border-bold border-line-strong bg-surface-raised p-(--space-4) md:p-(--space-6) text-center shadow-brutal-sm"
    >
      <Icon className="mx-auto mb-(--space-2) text-brand" size={24} />
      <p className="text-[30px] md:text-[34px] leading-none font-bold text-ink tabular-nums">{value}</p>
      <p className="text-[13px] text-ink-muted font-semibold mt-(--space-2)">{label}</p>
    </motion.div>
  );
}

function ProgressTile({ progress }: { progress: SeasonProgress }) {
  const pct = Math.round((progress.elapsedDays / progress.totalDays) * 100);
  const label = !progress.started ? "لم يبدأ الموسم بعد" : progress.ended ? "انتهى الموسم" : `اليوم ${progress.elapsedDays} من ${progress.totalDays}`;
  return (
    <motion.div
      {...fadeUp}
      transition={{ duration: 0.5, delay: 0.16 }}
      className="col-span-2 md:col-span-1 rounded-(--radius-md) border-bold border-line-strong bg-brand text-on-brand p-(--space-4) md:p-(--space-6) shadow-brutal-sm flex flex-col justify-center"
    >
      <div className="flex items-center justify-between mb-(--space-3)">
        <span className="flex items-center gap-1.5 text-[13px] font-bold">
          <Hourglass size={16} /> مسيرة الموسم
        </span>
        <span className="text-[13px] font-bold tabular-nums">{pct}%</span>
      </div>
      <div className="h-3 rounded-full bg-white/20 overflow-hidden border border-line-strong">
        <motion.div
          className="h-full rounded-full bg-accent-solid"
          initial={{ width: 0 }}
          whileInView={{ width: `${pct}%` }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: [0.2, 0, 0, 1], delay: 0.3 }}
        />
      </div>
      <p className="text-sm font-semibold mt-(--space-2) opacity-95">{label}</p>
    </motion.div>
  );
}
