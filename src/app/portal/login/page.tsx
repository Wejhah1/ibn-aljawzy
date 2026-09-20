"use client";

import { useActionState } from "react";
import Link from "next/link";
import { parentLoginAction, type LoginState } from "./actions";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function ParentLoginPage() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(parentLoginAction, null);

  return (
    <main className="min-h-screen flex items-center justify-center bg-surface px-(--space-4) py-(--space-8)">
      <div className="w-full max-w-[420px]">
        <Link href="/" className="inline-flex items-center gap-1 text-[13px] font-semibold text-ink-muted hover:text-ink mb-(--space-6)">
          <ArrowRight size={14} /> العودة للرئيسية
        </Link>
        <div className="text-center mb-(--space-8)">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-(--radius-md) bg-brand text-on-brand border-bold border-line-strong shadow-brutal-sm text-2xl font-bold mb-(--space-4)">
            ا
          </div>
          <h1 className="text-[22px] leading-[30px] font-bold text-ink">بوابة ولي الأمر</h1>
          <p className="text-[12px] leading-[18px] font-medium text-ink-muted mt-1">
            أدخل رقم جوالك المسجّل لدى البرنامج لمتابعة أبنائك
          </p>
        </div>
        <Card className="shadow-brutal">
          <form action={formAction} className="space-y-(--space-4)">
            <div>
              <Label htmlFor="phone">رقم الجوال</Label>
              <Input id="phone" name="phone" required dir="ltr" placeholder="05xxxxxxxx" autoFocus />
            </div>
            {state?.error && <p className="text-[13px] font-semibold text-danger">{state.error}</p>}
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "جارِ الدخول..." : "دخول"}
            </Button>
          </form>
        </Card>
      </div>
    </main>
  );
}
