"use client";

import { usePathname } from "next/navigation";
import { motion, useScroll, useTransform } from "framer-motion";
import { Search } from "lucide-react";
import { PRIMARY_NAV, STUDENTS_NAV, REPORTS_NAV, ADMIN_NAV } from "@/lib/nav";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { OPEN_COMMAND_PALETTE_EVENT } from "@/components/search/command-palette";

const ALL_NAV = [...PRIMARY_NAV, ...STUDENTS_NAV, ...REPORTS_NAV, ...ADMIN_NAV];

function titleFor(pathname: string) {
  if (pathname === "/admin") return "الرئيسية";
  const match = ALL_NAV.filter((n) => n.href !== "/admin" && pathname.startsWith(n.href)).sort((a, b) => b.href.length - a.href.length)[0];
  return match?.label ?? "لوحة الإدارة";
}

// شريط علوي ثابت للجوال: اسم الصفحة يظهر عند التمرير، مع البحث والإشعارات
export function MobileTopBar() {
  const pathname = usePathname();
  const { scrollY } = useScroll();
  const titleOpacity = useTransform(scrollY, [20, 60], [0, 1]);
  const shadow = useTransform(scrollY, [0, 24], ["0 0 0 0 #171b1800", "0 2px 10px 0 #171b1814"]);

  return (
    <motion.header
      className="md:hidden print:hidden fixed top-0 inset-x-0 z-40 bg-surface-raised/95 backdrop-blur border-b border-line pt-[env(safe-area-inset-top)]"
      style={{ boxShadow: shadow }}
    >
      <div className="flex h-14 items-center gap-(--space-2) px-(--space-3)">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-(--radius-sm) border-bold border-line-strong bg-surface-raised overflow-hidden p-0.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="" className="h-full w-full object-contain" />
        </span>
        <motion.p style={{ opacity: titleOpacity }} className="flex-1 min-w-0 truncate text-[15px] font-bold text-ink">
          {titleFor(pathname)}
        </motion.p>
        <button
          type="button"
          onClick={() => window.dispatchEvent(new Event(OPEN_COMMAND_PALETTE_EVENT))}
          aria-label="بحث عن طالب أو صفحة"
          className="flex h-10 w-10 items-center justify-center rounded-(--radius-sm) border-bold border-line-strong bg-surface-raised text-ink-muted hover:bg-surface-sunken active:translate-x-[1px] active:translate-y-[1px]"
        >
          <Search size={18} />
        </button>
        <NotificationBell />
      </div>
    </motion.header>
  );
}
