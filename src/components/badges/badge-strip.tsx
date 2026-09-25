"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface BadgeStripItem {
  name: string;
  icon: string | null;
}

export function BadgeStrip({
  badges,
  max = 3,
  size = "sm",
}: {
  badges: BadgeStripItem[] | null | undefined;
  max?: number;
  size?: "sm" | "md";
}) {
  const [open, setOpen] = useState<BadgeStripItem | null>(null);
  if (!badges || badges.length === 0) return null;

  const shown = badges.slice(0, max);
  const extra = badges.length - shown.length;
  const dim = size === "sm" ? "h-5 w-5 text-xs" : "h-7 w-7 text-[15px]";

  return (
    <>
      <div className="flex items-center gap-1 shrink-0">
        {shown.map((b, i) => (
          <button
            key={i}
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setOpen(b);
            }}
            title={b.name}
            aria-label={b.name}
            className={`flex items-center justify-center rounded-full bg-accent-soft border border-accent-solid shrink-0 leading-none hover:scale-110 transition-transform ${dim}`}
          >
            {b.icon || "🏅"}
          </button>
        ))}
        {extra > 0 && (
          <span className={`flex items-center justify-center rounded-full bg-surface-sunken text-ink-faint font-bold shrink-0 ${dim}`}>
            +{extra}
          </span>
        )}
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setOpen(null);
            }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/40 p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 8 }}
              transition={{ duration: 0.15, ease: [0.2, 0, 0, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="bg-surface-raised rounded-(--radius-md) border-bold border-line-strong shadow-brutal p-(--space-6) max-w-[280px] text-center"
            >
              <div className="text-4xl mb-(--space-2)">{open.icon || "🏅"}</div>
              <p className="font-bold text-ink">{open.name}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
