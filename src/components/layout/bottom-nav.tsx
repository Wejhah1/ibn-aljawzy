"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { BOTTOM_NAV, STUDENTS_NAV, REPORTS_NAV, ADMIN_NAV, PRIMARY_NAV, type NavItem } from "@/lib/nav";
import { X, Menu } from "lucide-react";

const MORE_GROUPS: { title: string; items: NavItem[] }[] = [
  { title: "العمل اليومي", items: PRIMARY_NAV.filter((i) => !BOTTOM_NAV.some((b) => b.href === i.href)) },
  { title: "الطلاب والتنظيم", items: STUDENTS_NAV.filter((i) => !BOTTOM_NAV.some((b) => b.href === i.href)) },
  { title: "الطباعة والتقارير", items: REPORTS_NAV },
  { title: "الإدارة", items: ADMIN_NAV },
];

export function BottomNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const items = [...BOTTOM_NAV.slice(0, 4)];

  return (
    <>
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-bold border-line-strong bg-surface-raised pb-[env(safe-area-inset-bottom)]"
        style={{ boxShadow: "0 -2px 10px #171b1814" }}
      >
        <div className="flex items-stretch justify-around h-16">
          {items.map((item) => {
            const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-1 flex-col items-center justify-center gap-1 min-w-[44px] min-h-[44px] transition-colors",
                  active ? "text-brand" : "text-ink-muted"
                )}
              >
                <Icon size={22} strokeWidth={active ? 2.5 : 2} />
                <span className="text-[11px] font-semibold leading-[16px]">{item.label}</span>
              </Link>
            );
          })}
          <button
            onClick={() => setMoreOpen(true)}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1 min-w-[44px] min-h-[44px] transition-colors",
              moreOpen ? "text-brand" : "text-ink-muted"
            )}
          >
            <Menu size={22} />
            <span className="text-[11px] font-semibold leading-[16px]">المزيد</span>
          </button>
        </div>
      </nav>

      {moreOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setMoreOpen(false)} />
          <div className="relative bg-surface-raised rounded-t-(--radius-lg) border-t-bold border-x-bold border-line-strong max-h-[75vh] overflow-y-auto pb-[calc(env(safe-area-inset-bottom)+16px)]">
            <div className="flex items-center justify-between px-(--space-4) h-14 border-b border-line sticky top-0 bg-surface-raised">
              <p className="text-sm font-bold text-ink">كل الصفحات</p>
              <button
                onClick={() => setMoreOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-(--radius-sm) text-ink-muted hover:bg-surface-sunken"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-(--space-4) space-y-(--space-5)">
              {MORE_GROUPS.filter((g) => g.items.length > 0).map((group) => (
                <div key={group.title}>
                  <p className="text-[12px] font-semibold text-ink-faint mb-(--space-2)">{group.title}</p>
                  <div className="grid grid-cols-3 gap-(--space-2)">
                    {group.items.map((item) => {
                      const active = pathname.startsWith(item.href);
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMoreOpen(false)}
                          className={cn(
                            "flex flex-col items-center justify-center gap-1.5 rounded-(--radius-sm) border-bold px-(--space-2) py-(--space-3) text-center min-h-[76px]",
                            active
                              ? "bg-brand text-on-brand border-line-strong shadow-brutal-sm"
                              : "bg-surface border-line-strong text-ink-muted"
                          )}
                        >
                          <Icon size={20} />
                          <span className="text-[11px] font-semibold leading-tight">{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
