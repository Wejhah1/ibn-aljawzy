"use client";

import { Lottie } from "lottie-react";

export function LottieLoader({ size = 96, label }: { size?: number; label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2" role="status" aria-live="polite">
      <Lottie src="/loader.json" autoplay loop style={{ width: size, height: size }} />
      {label && <span className="text-sm font-semibold text-ink-muted">{label}</span>}
    </div>
  );
}
