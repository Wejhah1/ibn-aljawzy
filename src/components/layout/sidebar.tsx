"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { PRIMARY_NAV, STUDENTS_NAV, REPORTS_NAV, ADMIN_NAV, type NavItem } from "@/lib/nav";
import { logoutAction } from "@/app/admin/login/actions";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { LogOut, Search } from "lucide-react";
import { OPEN_COMMAND_PALETTE_EVENT } from "@/components/search/command-palette";

function NavGroup({ title, items, pathname }: { title: string; items: NavItem[]; pathname: string }) {
  return (
    <div className="mb-(--space-6)">
      <p className="px-(--space-3) mb-(--space-2) text-[12px] leading-[16px] font-semibold tracking-[0.01em] text-ink-faint">
        {title}
      </p>
      <div className="space-y-1">
        {items.map((item) => {
          const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false}
              className={cn(
                "flex items-center gap-(--space-3) rounded-(--radius-sm) px-(--space-3) h-11 text-sm font-semibold transition-colors",
                active
                  ? "bg-brand text-on-brand shadow-brutal-sm border-bold border-line-strong"
                  : "text-ink-muted hover:bg-surface-sunken hover:text-ink"
              )}
            >
              <Icon size={18} strokeWidth={2.25} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function Sidebar({ userName, userRole }: { userName: string; userRole: string }) {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-[264px] shrink-0 flex-col border-l border-line bg-surface-raised h-screen sticky top-0 overflow-y-auto">
      <div className="flex items-center justify-between gap-(--space-2) px-(--space-4) py-(--space-4) border-b border-line shrink-0">
        <div className="flex flex-col items-center gap-(--space-2) flex-1 min-w-0">
          <div className="flex h-12 w-12 items-center justify-center rounded-(--radius-sm) bg-surface-raised border-bold border-line-strong shrink-0 overflow-hidden p-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="شعار حلقات ابن الجوزي" className="h-full w-full object-contain" />
          </div>
          <div className="min-w-0 text-center">
            <p className="text-[13px] font-bold text-ink truncate">حلقات ابن الجوزي</p>
            <p className="text-xs text-ink-muted truncate">مسجد الطرباق</p>
          </div>
        </div>
        <NotificationBell />
      </div>

      <div className="px-(--space-3) pt-(--space-4)">
        <button
          type="button"
          onClick={() => window.dispatchEvent(new Event(OPEN_COMMAND_PALETTE_EVENT))}
          className="flex w-full items-center gap-(--space-2) h-10 rounded-(--radius-sm) border border-line bg-surface px-(--space-3) text-[13px] text-ink-faint hover:border-line-strong hover:text-ink-muted transition-colors"
        >
          <Search size={15} />
          <span className="flex-1 text-right">بحث عن طالب أو صفحة</span>
          <kbd className="text-xs border border-line rounded px-1.5 py-0.5 font-sans" dir="ltr">Ctrl K</kbd>
        </button>
      </div>

      <nav className="flex-1 px-(--space-3) py-(--space-4)">
        <NavGroup title="العمل اليومي" items={PRIMARY_NAV} pathname={pathname} />
        <NavGroup title="الطلاب والتنظيم" items={STUDENTS_NAV} pathname={pathname} />
        <NavGroup title="الطباعة والتقارير" items={REPORTS_NAV} pathname={pathname} />
        <NavGroup title="الإدارة" items={ADMIN_NAV} pathname={pathname} />
      </nav>

      <div className="border-t border-line p-(--space-3) shrink-0">
        <div className="flex items-center gap-(--space-3) rounded-(--radius-sm) px-(--space-2) py-(--space-2)">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-soft text-brand-hover font-bold text-sm shrink-0">
            {userName.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-ink truncate">{userName}</p>
            <p className="text-xs text-ink-muted truncate">{roleLabel(userRole)}</p>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="flex h-9 w-9 items-center justify-center rounded-(--radius-sm) text-ink-muted hover:bg-danger-soft hover:text-danger transition-colors"
              title="تسجيل الخروج" aria-label="تسجيل الخروج"
            >
              <LogOut size={16} />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}

function roleLabel(role: string) {
  if (role === "admin") return "مدير";
  if (role === "supervisor") return "مشرف";
  return "إدخال بيانات";
}
