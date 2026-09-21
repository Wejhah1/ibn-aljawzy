"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Users, CircleDot, Calendar, BookOpen, Trophy, ShieldCheck, ArrowLeft, GraduationCap, Megaphone, Sparkles, Star } from "lucide-react";

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
  published_at: string;
}

const FEATURES = [
  { icon: BookOpen, title: "حفظ وتلاوة", desc: "برنامج يومي منظم لحفظ القرآن الكريم ومراجعته بإشراف معلمين مؤهلين." },
  { icon: Trophy, title: "نظام نقاط وحوافز", desc: "تحفيز مستمر للطلاب عبر النقاط، الإنجازات، والأوسمة على مدار الموسم." },
  { icon: ShieldCheck, title: "متابعة أولياء الأمور", desc: "بوابة خاصة لولي الأمر لمتابعة حضور ونتائج ابنه أولاً بأول." },
];

const NEWS_STYLES = [
  { icon: GraduationCap, label: "إنجاز", bg: "bg-info", soft: "bg-info-soft", fg: "text-info" },
  { icon: Sparkles, label: "فعالية", bg: "bg-accent-solid", soft: "bg-accent-soft", fg: "text-accent" },
  { icon: Megaphone, label: "إعلان", bg: "bg-brand", soft: "bg-brand-soft", fg: "text-brand" },
];

export function HomeClient({ stats, content, news }: { stats: PublicStats; content: HomepageContent; news: NewsPost[] }) {
  const title = content.hero_title?.trim() || "حلقات ابن الجوزي";
  const subtitle =
    content.hero_subtitle?.trim() ||
    "برنامج تحفيظ صيفي بمسجد الطرباق — يجمع بين حفظ القرآن الكريم، التحفيز بنظام النقاط، ومتابعة دقيقة لأولياء الأمور طوال الموسم.";

  return (
    <main className="min-h-screen bg-surface overflow-x-hidden">
      <header className="border-b border-line">
        <div className="max-w-[1100px] mx-auto px-(--space-4) h-16 flex items-center justify-between">
          <div className="flex items-center gap-(--space-2)">
            {content.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={content.logo_url} alt={title} className="h-9 w-9 rounded-(--radius-sm) object-cover border-bold border-line-strong" />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-(--radius-sm) bg-surface-raised border-bold border-line-strong overflow-hidden p-0.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.svg" alt={title} className="h-full w-full object-contain" />
              </div>
            )}
            <p className="text-sm font-bold text-ink hidden sm:block">{title}</p>
          </div>
          <div className="flex items-center gap-(--space-2)">
            <Link href="/portal/login">
              <Button size="sm" variant="secondary">
                بوابة ولي الأمر
              </Button>
            </Link>
            <Link href="/admin/login">
              <Button size="sm" variant="ghost">
                دخول الإدارة
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative px-(--space-4) py-(--space-12) md:py-20 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.5, scale: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-brand-soft blur-3xl pointer-events-none"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.4, scale: 1 }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
          className="absolute -bottom-24 -right-10 h-80 w-80 rounded-full bg-accent-soft blur-3xl pointer-events-none"
        />

        <div className="relative max-w-[800px] mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 rounded-full border-bold border-line-strong bg-surface-raised px-(--space-4) py-(--space-2) text-[13px] font-bold text-brand mb-(--space-6) shadow-brutal-sm"
          >
            <Calendar size={14} />
            {stats.season_name ? `الموسم الحالي: ${stats.season_name}` : "البرنامج الصيفي"}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-[32px] md:text-[48px] leading-[1.2] font-bold text-ink mb-(--space-4)"
          >
            {title}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-base md:text-lg text-ink-muted mb-(--space-8) max-w-[560px] mx-auto"
          >
            {subtitle}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex items-center justify-center gap-(--space-3) flex-wrap"
          >
            <Link href="/portal/login">
              <Button size="lg">
                متابعة ابني <ArrowLeft size={16} />
              </Button>
            </Link>
            <Link href="/leaderboard">
              <Button size="lg" variant="secondary">
                <Trophy size={16} /> لوحة المتصدرين
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* إحصاءات */}
      <section className="px-(--space-4) pb-(--space-12)">
        <div className="max-w-[800px] mx-auto grid grid-cols-2 gap-(--space-4)">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            whileHover={{ y: -3 }}
            className="rounded-(--radius-md) border-bold border-line-strong bg-surface-raised p-(--space-6) text-center shadow-brutal-sm transition-shadow hover:shadow-brutal"
          >
            <Users className="mx-auto mb-(--space-2) text-brand" size={26} />
            <p className="text-[32px] font-bold text-ink">{stats.total_active_students}</p>
            <p className="text-[13px] text-ink-muted font-semibold">طالب مسجّل</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            whileHover={{ y: -3 }}
            className="rounded-(--radius-md) border-bold border-line-strong bg-surface-raised p-(--space-6) text-center shadow-brutal-sm transition-shadow hover:shadow-brutal"
          >
            <CircleDot className="mx-auto mb-(--space-2) text-brand" size={26} />
            <p className="text-[32px] font-bold text-ink">{stats.total_circles}</p>
            <p className="text-[13px] text-ink-muted font-semibold">حلقة تحفيظ</p>
          </motion.div>
        </div>
      </section>

      {/* مميزات البرنامج */}
      <section className="px-(--space-4) pb-20">
        <div className="max-w-[1000px] mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-[22px] font-bold text-ink text-center mb-(--space-8)"
          >
            لماذا حلقات ابن الجوزي؟
          </motion.h2>
          <div className="grid md:grid-cols-3 gap-(--space-4)">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ y: -4 }}
                className="group rounded-(--radius-lg) border-bold border-line-strong bg-surface-raised p-(--space-6) transition-shadow hover:shadow-brutal"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-(--radius-sm) bg-brand-soft text-brand-hover mb-(--space-4) transition-transform group-hover:scale-110">
                  <f.icon size={20} />
                </div>
                <h3 className="text-[16px] font-bold text-ink mb-(--space-2)">{f.title}</h3>
                <p className="text-sm text-ink-muted leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {news.length > 0 && (
        <section className="px-(--space-4) pb-20">
          <div className="max-w-[1000px] mx-auto">
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-[22px] font-bold text-ink text-center mb-(--space-8)"
            >
              آخر الأخبار
            </motion.h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-(--space-4)">
              {news.map((n, i) => {
                const style = NEWS_STYLES[i % NEWS_STYLES.length];
                const Icon = style.icon;
                return (
                  <motion.div
                    key={n.id}
                    initial={{ opacity: 0, y: 28 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                    whileHover={{ y: -4 }}
                    className="group rounded-(--radius-lg) border-bold border-line-strong bg-surface-raised overflow-hidden shadow-brutal-sm transition-shadow hover:shadow-brutal"
                  >
                    {n.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={n.image_url}
                        alt={n.title}
                        className="w-full h-40 object-cover border-b border-line-strong transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className={`relative h-28 ${style.bg} flex items-center justify-center overflow-hidden`}>
                        <div className="absolute -left-4 -bottom-6 h-20 w-20 rounded-full bg-white/10" />
                        <div className="absolute -right-6 -top-8 h-24 w-24 rounded-full bg-white/10" />
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                          <Icon size={22} className="text-white" />
                        </div>
                      </div>
                    )}
                    <div className="p-(--space-4)">
                      <span className={`inline-flex items-center gap-1 rounded-full ${style.soft} ${style.fg} px-(--space-2) py-0.5 text-[11px] font-bold mb-(--space-2)`}>
                        <Star size={10} className="fill-current" />
                        {style.label}
                      </span>
                      <h3 className="text-[15px] font-bold text-ink mb-(--space-2)">{n.title}</h3>
                      {n.body && <p className="text-sm text-ink-muted leading-relaxed line-clamp-3">{n.body}</p>}
                      <p className="text-[11px] text-ink-faint mt-(--space-3)">
                        {new Date(n.published_at).toLocaleDateString("ar-SA")}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <footer className="border-t border-line py-(--space-8) px-(--space-4)">
        <div className="max-w-[1100px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-(--space-3) text-[13px] text-ink-muted">
          <p>© {new Date().getFullYear()} حلقات ابن الجوزي — مسجد الطرباق</p>
          <Link href="/admin/login" className="hover:text-ink">
            دخول فريق الإدارة
          </Link>
        </div>
      </footer>
    </main>
  );
}
