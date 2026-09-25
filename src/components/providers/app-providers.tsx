"use client";

import { type ReactNode } from "react";
import { MotionConfig } from "framer-motion";
import { Toaster } from "sonner";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    // احترام إعداد «تقليل الحركة» في جهاز المستخدم لكل حركات framer-motion
    <MotionConfig reducedMotion="user">
      {children}
      <Toaster
        position="top-center"
        dir="rtl"
        offset={16}
        mobileOffset={{ top: "calc(env(safe-area-inset-top) + 12px)" }}
        toastOptions={{
          style: {
            fontFamily: "var(--font-sans)",
            background: "var(--color-ink)",
            color: "var(--color-surface)",
            border: "1.5px solid var(--color-line-strong)",
            borderRadius: "var(--radius-md)",
            boxShadow: "var(--shadow-brutal-sm)",
            fontWeight: 600,
          },
          classNames: {
            success: "[&_[data-icon]]:text-[#7fd8b4]",
            error: "!bg-danger !text-on-danger",
          },
        }}
      />
    </MotionConfig>
  );
}
