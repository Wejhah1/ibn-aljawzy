"use client";

import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { PRIMARY_NAV, STUDENTS_NAV, REPORTS_NAV, ADMIN_NAV } from "@/lib/nav";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { openCommandPalette } from "@/components/search/command-palette";

const ALL_NAV = [...PRIMARY_NAV, ...STUDENTS_NAV, ...REPORTS_NAV, ...ADMIN_NAV];

function titleFor(pathname: string) {
  if (pathname === "/admin") return "الرئيسية";
  const match = ALL_NAV.filter((n) => n.href !== "/admin" && pathname.startsWith(n.href)).sort(
    (a, b) => b.href.length - a.href.length
  )[0];
  return match?.label ?? "حلقات ابن الجوزي";
}

// شريط الجوال العلوي (TopBar في نظام التصميم): البحث، اسم الصفحة في الوسط، الإشعارات.
export function MobileTopBar() {
  const pathname = usePathname();
  return (
    <header className="md:hidden print:hidden fixed top-0 inset-x-0 z-40 bg-surface-raised border-b border-bold border-line-strong pt-[env(safe-area-inset-top)]">
      <div className="grid grid-cols-[44px_1fr_44px] items-center h-14 px-(--space-3)">
        <button
          type="button"
          onClick={openCommandPalette}
          title="بحث"
          className="flex h-10 w-10 items-center justify-center rounded-(--radius-sm) border-bold border-line-strong bg-surface-raised text-ink-muted hover:bg-surface-sunken transition-colors"
        >
          <Search size={18} />
        </button>
        <p className="text-center text-[16px] font-bold text-ink truncate px-(--space-2)">{titleFor(pathname)}</p>
        <NotificationBell />
      </div>
    </header>
  );
}
