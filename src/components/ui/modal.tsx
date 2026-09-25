"use client";

import { type ReactNode, useEffect, useSyncExternalStore } from "react";
import { motion, useDragControls, type PanInfo } from "framer-motion";
import { X } from "lucide-react";
import { CardTitle } from "@/components/ui/card";

// على الجوال: لوحة سفلية (Bottom Sheet) تُسحب للأسفل لإغلاقها.
// على الشاشات الكبيرة: نافذة في المنتصف.
const DESKTOP_QUERY = "(min-width: 768px)";
function subscribeDesktop(callback: () => void) {
  const mq = window.matchMedia(DESKTOP_QUERY);
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}
export function useIsDesktop() {
  return useSyncExternalStore(
    subscribeDesktop,
    () => window.matchMedia(DESKTOP_QUERY).matches,
    () => false
  );
}

// قفل تمرير الصفحة خلف النافذة، مع دعم النوافذ المتداخلة
let lockCount = 0;
export function useScrollLock(active = true) {
  useEffect(() => {
    if (!active) return;
    lockCount += 1;
    if (lockCount === 1) document.body.style.overflow = "hidden";
    return () => {
      lockCount -= 1;
      if (lockCount === 0) document.body.style.overflow = "";
    };
  }, [active]);
}

export function Modal({
  title,
  onClose,
  children,
  maxWidth = "480px",
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  maxWidth?: string;
}) {
  const desktop = useIsDesktop();
  const dragControls = useDragControls();
  useScrollLock();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 110 || info.velocity.y > 600) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-(--space-6)">
      <motion.div
        className="absolute inset-0 bg-ink/40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        aria-hidden
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative w-full max-h-[92vh] flex flex-col bg-surface-raised border-bold border-line-strong rounded-t-(--radius-lg) md:rounded-(--radius-lg) shadow-brutal border-b-0 md:border-b-[1.5px] pb-[env(safe-area-inset-bottom)] md:pb-0"
        style={{ maxWidth }}
        initial={desktop ? { opacity: 0, scale: 0.96, y: 8 } : { y: "100%" }}
        animate={desktop ? { opacity: 1, scale: 1, y: 0 } : { y: 0 }}
        transition={desktop ? { duration: 0.18, ease: [0.2, 0, 0, 1] } : { type: "spring", damping: 32, stiffness: 380 }}
        drag={desktop ? false : "y"}
        dragListener={false}
        dragControls={dragControls}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.6 }}
        onDragEnd={handleDragEnd}
      >
        <div
          className="md:hidden flex justify-center pt-(--space-2) pb-1 touch-none cursor-grab"
          onPointerDown={(e) => dragControls.start(e)}
        >
          <span className="h-1.5 w-10 rounded-full bg-line" />
        </div>
        <div
          className="flex items-center justify-between gap-(--space-3) px-(--space-4) pt-(--space-2) md:pt-(--space-4) pb-(--space-3) touch-none md:touch-auto"
          onPointerDown={(e) => {
            if (!desktop) dragControls.start(e);
          }}
        >
          <CardTitle>{title}</CardTitle>
          <button
            onClick={onClose}
            aria-label="إغلاق"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-(--radius-sm) text-ink-muted hover:bg-surface-sunken hover:text-ink"
          >
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto overscroll-contain px-(--space-4) pb-(--space-4)">{children}</div>
      </motion.div>
    </div>
  );
}
