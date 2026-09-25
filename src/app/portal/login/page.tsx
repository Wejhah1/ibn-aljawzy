"use client";

import { useActionState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { parentLoginAction, type LoginState } from "./actions";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { GeometricPattern } from "@/components/ui/geometric-pattern";
import { ArrowRight, CalendarCheck, Loader2, Smartphone, Sparkles, Trophy } from "lucide-react";

const PERKS = [
  { icon: CalendarCheck, label: "الحضور" },
  { icon: Trophy, label: "النقاط" },
  { icon: Sparkles, label: "الأوسمة" },
];

export default function ParentLoginPage() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(parentLoginAction, null);

  return (
    <main className="relative min-h-screen flex items-center justify-center bg-surface px-(--space-4) py-(--space-8) overflow-hidden">
      <GeometricPattern className="absolute inset-x-0 top-0 h-[340px] text-brand opacity-[0.07]" />
      <motion.div
        className="relative w-full max-w-[420px]"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.2, 0, 0, 1] }}
      >
        <Link href="/" className="inline-flex items-center gap-1 h-10 text-[13px] font-semibold text-ink-muted hover:text-ink mb-(--space-4)">
          <ArrowRight size={15} /> العودة إلى الرئيسية
        </Link>
        <div className="text-center mb-(--space-6)">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-(--radius-md) bg-surface-raised border-bold border-line-strong shadow-brutal-sm mb-(--space-4) overflow-hidden p-1.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="شعار حلقات ابن الجوزي" className="h-full w-full object-contain" />
          </div>
          <h1 className="text-[24px] leading-[32px] font-bold text-ink">بوابة ولي الأمر</h1>
          <p className="text-sm leading-relaxed text-ink-muted mt-1">تابع حضور ابنك ونقاطه ونتائجه أولاً بأول</p>
          <div className="flex items-center justify-center gap-(--space-2) mt-(--space-4)">
            {PERKS.map((p) => (
              <span key={p.label} className="inline-flex items-center gap-1 rounded-full bg-brand-soft text-brand-hover px-(--space-3) py-1 text-xs font-bold">
                <p.icon size={13} /> {p.label}
              </span>
            ))}
          </div>
        </div>
        <Card className="shadow-brutal border-line-strong p-(--space-5)">
          <form action={formAction} className="space-y-(--space-4)">
            <div>
              <Label htmlFor="phone">رقم الجوال المسجّل لدى الحلقة</Label>
              <div className="relative">
                <Smartphone size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none" />
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  required
                  dir="ltr"
                  placeholder="05xxxxxxxx"
                  autoFocus
                  aria-invalid={!!state?.error}
                  aria-describedby={state?.error ? "phone-error" : "phone-help"}
                  className="h-12 pr-10 text-base tracking-wider text-right placeholder:text-right"
                />
              </div>
            </div>
            {state?.error && (
              <motion.p
                id="phone-error"
                role="alert"
                initial={{ opacity: 0, x: 6 }}
                animate={{ opacity: 1, x: [6, -6, 4, -2, 0] }}
                transition={{ duration: 0.35 }}
                className="rounded-(--radius-sm) bg-danger-soft px-(--space-3) py-(--space-2) text-[13px] font-semibold text-danger"
              >
                {state.error}
              </motion.p>
            )}
            <Button type="submit" size="lg" className="w-full" disabled={pending}>
              {pending ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> جارٍ الدخول...
                </>
              ) : (
                "دخول"
              )}
            </Button>
          </form>
        </Card>
        <p id="phone-help" className="text-xs leading-relaxed text-ink-muted text-center mt-(--space-4)">
          رقمك غير مسجّل أو تغيّر؟ تواصل مع إدارة الحلقة لتحديثه.
        </p>
      </motion.div>
    </main>
  );
}
