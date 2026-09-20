import { createAdminClient } from "@/lib/supabase/admin";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const admin = createAdminClient();
  const { count } = await admin.from("profiles").select("id", { count: "exact", head: true });
  const hasNoAccounts = (count ?? 0) === 0;

  return (
    <main className="min-h-screen flex items-center justify-center bg-surface px-(--space-4) py-(--space-8)">
      <div className="w-full max-w-[420px]">
        <div className="text-center mb-(--space-8)">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-(--radius-md) bg-surface-raised border-bold border-line-strong shadow-brutal-sm mb-(--space-4) overflow-hidden p-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="شعار حلقات ابن الجوزي" className="h-full w-full object-contain" />
          </div>
          <h1 className="text-[22px] leading-[30px] font-bold text-ink">حلقات ابن الجوزي الصيفي</h1>
          <p className="text-[12px] leading-[18px] font-medium text-ink-muted mt-1">
            لوحة تحكم فريق الإدارة — مسجد الطرباق
          </p>
        </div>
        <LoginForm hasNoAccounts={hasNoAccounts} />
      </div>
    </main>
  );
}
