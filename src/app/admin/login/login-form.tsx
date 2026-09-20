"use client";

import { useActionState, useState } from "react";
import { loginAction, signupAction, type AuthState } from "./actions";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function LoginForm({ hasNoAccounts }: { hasNoAccounts: boolean }) {
  const [mode, setMode] = useState<"login" | "signup">(hasNoAccounts ? "signup" : "login");

  const [loginState, loginFormAction, loginPending] = useActionState<AuthState, FormData>(
    loginAction,
    null
  );
  const [signupState, signupFormAction, signupPending] = useActionState<AuthState, FormData>(
    signupAction,
    null
  );

  if (mode === "signup") {
    return (
      <Card className="shadow-brutal">
        {hasNoAccounts && (
          <div className="mb-(--space-4) rounded-(--radius-sm) bg-brand-soft px-(--space-3) py-(--space-2) text-[13px] font-semibold text-brand-hover">
            لا يوجد أي حساب بعد — الحساب الأول الذي يُنشأ هنا يحصل تلقائياً على صلاحية &quot;إدارة&quot;.
          </div>
        )}
        <form action={signupFormAction} className="space-y-(--space-4)">
          <div>
            <Label htmlFor="full_name">الاسم الكامل</Label>
            <Input id="full_name" name="full_name" required autoComplete="name" />
          </div>
          <div>
            <Label htmlFor="username">اسم المستخدم</Label>
            <Input id="username" name="username" required autoComplete="username" />
          </div>
          <div>
            <Label htmlFor="password">كلمة المرور</Label>
            <Input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" />
          </div>
          <div>
            <Label htmlFor="confirm_password">تأكيد كلمة المرور</Label>
            <Input id="confirm_password" name="confirm_password" type="password" required minLength={8} autoComplete="new-password" />
          </div>
          {signupState?.error && (
            <p className="text-[13px] font-semibold text-danger">{signupState.error}</p>
          )}
          <Button type="submit" className="w-full" disabled={signupPending}>
            {signupPending ? "جارِ الإنشاء..." : "إنشاء الحساب"}
          </Button>
        </form>
        {!hasNoAccounts && (
          <button
            type="button"
            onClick={() => setMode("login")}
            className="mt-(--space-4) w-full text-center text-[13px] font-semibold text-brand hover:text-brand-hover"
          >
            لديك حساب بالفعل؟ تسجيل الدخول
          </button>
        )}
      </Card>
    );
  }

  return (
    <Card className="shadow-brutal">
      <form action={loginFormAction} className="space-y-(--space-4)">
        <div>
          <Label htmlFor="username">اسم المستخدم</Label>
          <Input id="username" name="username" required autoComplete="username" autoFocus />
        </div>
        <div>
          <Label htmlFor="password">كلمة المرور</Label>
          <Input id="password" name="password" type="password" required autoComplete="current-password" />
        </div>
        {loginState?.error && (
          <p className="text-[13px] font-semibold text-danger">{loginState.error}</p>
        )}
        <Button type="submit" className="w-full" disabled={loginPending}>
          {loginPending ? "جارِ الدخول..." : "تسجيل الدخول"}
        </Button>
      </form>
      <button
        type="button"
        onClick={() => setMode("signup")}
        className="mt-(--space-4) w-full text-center text-[13px] font-semibold text-brand hover:text-brand-hover"
      >
        حساب جديد (يتطلب موافقة مدير)
      </button>
    </Card>
  );
}
