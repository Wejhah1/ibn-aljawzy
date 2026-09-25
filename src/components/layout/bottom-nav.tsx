"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useDragControls } from "framer-motion";
import { cn } from "@/lib/utils";
import { BOTTOM_NAV, STUDENTS_NAV, REPORTS_NAV, ADMIN_NAV, PRIMARY_NAV, type NavItem } from "@/lib/nav";
import { useScrollLock } from "@/components/ui/modal";
import { X, Menu } from "lucide-react";

const MORE_GROUPS: { title: string; items: NavItem[] }[] = [
  { title: "العمل اليومي", items: PRIMARY_NAV.filter((i) => !BOTTOM_NAV.some((b) => b.href === i.href)) },
  { title: "الطلاب والتنظيم", items: STUDENTS_NAV.filter((i) => !BOTTOM_NAV.some((b) => b.href === i.href)) },
  { title: "الطباعة والتقارير", items: REPORTS_NAV },
  { title: "الإدارة", items: ADMIN_NAV },
];

function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

export function BottomNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreActive = !BOTTOM_NAV.some((item) => isActive(pathname, item.href));

  return (
    <>
      <nav
        aria-label="التنقل الرئيسي"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-bold border-line-strong bg-surface-raised pb-[env(safe-area-inset-bottom)]"
        style={{ boxShadow: "0 -2px 10px #171b1814" }}
      >
        <div className="flex items-stretch justify-around h-16">
          {BOTTOM_NAV.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={false}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-1 flex-col items-center justify-center gap-0.5 min-w-[44px] min-h-[44px] transition-colors active:scale-95",
                  active ? "text-brand-hover" : "text-ink-muted"
                )}
              >
                <NavIcon icon={item.icon} active={active} />
                <span className={cn("text-xs leading-[16px]", active ? "font-bold" : "font-semibold")}>{item.label}</span>
              </Link>
            );
          })}
          <button
            onClick={() => setMoreOpen(true)}
            aria-expanded={moreOpen}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-0.5 min-w-[44px] min-h-[44px] transition-colors active:scale-95",
              moreActive || moreOpen ? "text-brand-hover" : "text-ink-muted"
            )}
          >
            <NavIcon icon={Menu} active={moreActive} />
            <span className={cn("text-xs leading-[16px]", moreActive ? "font-bold" : "font-semibold")}>المزيد</span>
          </button>
        </div>
      </nav>

      <AnimatePresence>{moreOpen && <MoreSheet pathname={pathname} onClose={() => setMoreOpen(false)} />}</AnimatePresence>
    </>
  );
}

// كبسولة خلف أيقونة الصفحة النشطة، تنزلق بين العناصر عند التنقل
function NavIcon({ icon: Icon, active }: { icon: NavItem["icon"]; active: boolean }) {
  return (
    <span className="relative flex h-7 w-14 items-center justify-center">
      {active && (
        <motion.span
          layoutId="bottom-nav-pill"
          className="absolute inset-0 rounded-full bg-brand-soft border-bold border-line-strong"
          style={{ boxShadow: "2px 2px 0 0 var(--color-line-strong)" }}
          transition={{ type: "spring", stiffness: 500, damping: 38 }}
        />
      )}
      <Icon size={20} strokeWidth={active ? 2.5 : 2} className="relative" />
    </span>
  );
}

function MoreSheet({ pathname, onClose }: { pathname: string; onClose: () => void }) {
  const dragControls = useDragControls();
  useScrollLock();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
      <motion.div
        className="absolute inset-0 bg-ink/40"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="كل الصفحات"
        className="relative bg-surface-raised rounded-t-(--radius-lg) border-t-bold border-x-bold border-line-strong max-h-[75vh] overflow-y-auto overscroll-contain pb-[calc(env(safe-area-inset-bottom)+16px)]"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 32, stiffness: 380 }}
        drag="y"
        dragListener={false}
        dragControls={dragControls}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.6 }}
        onDragEnd={(_, info) => {
          if (info.offset.y > 110 || info.velocity.y > 600) onClose();
        }}
      >
        <div
          className="sticky top-0 z-10 bg-surface-raised border-b border-line touch-none"
          onPointerDown={(e) => dragControls.start(e)}
        >
          <div className="flex justify-center pt-(--space-2)">
            <span className="h-1.5 w-10 rounded-full bg-line" />
          </div>
          <div className="flex items-center justify-between px-(--space-4) h-12">
            <p className="text-sm font-bold text-ink">كل الصفحات</p>
            <button
              onClick={onClose}
              aria-label="إغلاق"
              className="flex h-9 w-9 items-center justify-center rounded-(--radius-sm) text-ink-muted hover:bg-surface-sunken"
            >
              <X size={18} />
            </button>
          </div>
        </div>
        <div className="p-(--space-4) space-y-(--space-5)">
          {MORE_GROUPS.filter((g) => g.items.length > 0).map((group) => (
            <div key={group.title}>
              <p className="text-xs font-semibold text-ink-faint mb-(--space-2)">{group.title}</p>
              <div className="grid grid-cols-3 gap-(--space-2)">
                {group.items.map((item) => {
                  const active = pathname.startsWith(item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      prefetch={false}
                      onClick={onClose}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex flex-col items-center justify-center gap-1.5 rounded-(--radius-sm) border-bold px-(--space-2) py-(--space-3) text-center min-h-[76px] transition-transform active:translate-x-[1px] active:translate-y-[1px]",
                        active
                          ? "bg-brand text-on-brand border-line-strong shadow-brutal-sm"
                          : "bg-surface border-line-strong text-ink-muted"
                      )}
                    >
                      <Icon size={20} />
                      <span className="text-xs font-semibold leading-tight">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
