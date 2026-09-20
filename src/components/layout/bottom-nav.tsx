"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { BOTTOM_NAV } from "@/lib/nav";

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-bold border-line-strong bg-surface-raised pb-[env(safe-area-inset-bottom)]"
      style={{ boxShadow: "0 -2px 10px #171b1814" }}
    >
      <div className="flex items-stretch justify-around h-16">
        {BOTTOM_NAV.map((item) => {
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
      </div>
    </nav>
  );
}
