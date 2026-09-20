"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, User, ArrowLeft } from "lucide-react";
import { globalSearchStudentsAction, type GlobalSearchStudent } from "@/app/admin/(protected)/global-search-actions";
import { PRIMARY_NAV, STUDENTS_NAV, REPORTS_NAV, ADMIN_NAV } from "@/lib/nav";

const ALL_NAV = [...PRIMARY_NAV, ...STUDENTS_NAV, ...REPORTS_NAV, ...ADMIN_NAV];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [students, setStudents] = useState<GlobalSearchStudent[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
    else {
      setQuery("");
      setStudents([]);
    }
  }, [open]);

  useEffect(() => {
    if (!query.trim()) {
      setStudents([]);
      return;
    }
    const t = setTimeout(async () => {
      setStudents(await globalSearchStudentsAction(query));
    }, 200);
    return () => clearTimeout(t);
  }, [query]);

  const filteredNav = ALL_NAV.filter((n) => n.label.includes(query.trim()));

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center bg-ink/40 pt-[10vh] px-(--space-4)" onClick={() => setOpen(false)}>
      <div
        className="w-full max-w-[560px] bg-surface-raised rounded-(--radius-lg) border-bold border-line-strong shadow-brutal overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-(--space-3) px-(--space-4) h-14 border-b border-line">
          <Search size={18} className="text-ink-faint" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث عن طالب أو صفحة... (Ctrl+K)"
            className="flex-1 bg-transparent outline-none text-sm text-ink placeholder:text-ink-faint"
          />
          <kbd className="text-[11px] text-ink-faint border border-line rounded px-1.5 py-0.5">Esc</kbd>
        </div>

        <div className="max-h-[400px] overflow-y-auto py-(--space-2)">
          {students.length > 0 && (
            <div className="px-(--space-2) mb-(--space-2)">
              <p className="px-(--space-2) text-[11px] font-semibold text-ink-faint mb-1">الطلاب</p>
              {students.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    router.push(`/admin/students/${s.id}`);
                    setOpen(false);
                  }}
                  className="w-full flex items-center gap-(--space-2) px-(--space-2) py-(--space-2) rounded-(--radius-sm) hover:bg-surface-sunken text-right"
                >
                  <User size={15} className="text-brand" />
                  <span className="text-sm text-ink">{s.full_name}</span>
                  <span className="text-[12px] text-ink-faint">#{s.code}</span>
                </button>
              ))}
            </div>
          )}

          {filteredNav.length > 0 && (
            <div className="px-(--space-2)">
              <p className="px-(--space-2) text-[11px] font-semibold text-ink-faint mb-1">الصفحات</p>
              {filteredNav.map((n) => (
                <button
                  key={n.href}
                  onClick={() => {
                    router.push(n.href);
                    setOpen(false);
                  }}
                  className="w-full flex items-center gap-(--space-2) px-(--space-2) py-(--space-2) rounded-(--radius-sm) hover:bg-surface-sunken text-right"
                >
                  <ArrowLeft size={14} className="text-ink-muted" />
                  <span className="text-sm text-ink">{n.label}</span>
                </button>
              ))}
            </div>
          )}

          {query && students.length === 0 && filteredNav.length === 0 && (
            <p className="text-center text-[13px] text-ink-muted py-(--space-6)">لا نتائج.</p>
          )}
        </div>
      </div>
    </div>
  );
}
