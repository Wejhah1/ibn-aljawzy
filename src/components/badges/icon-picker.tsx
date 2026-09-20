"use client";

import { useState } from "react";
import { Label } from "@/components/ui/input";

const ICON_OPTIONS = [
  "🏅", "🥇", "🥈", "🥉", "🏆", "⭐", "🌟", "✨", "🎖️", "👑",
  "📿", "🕌", "📖", "🕋", "🌙", "🤲", "💚", "🔥", "💎", "🎯",
  "📌", "🎗️", "🛡️", "⚡", "🌸", "🌺", "🦋", "🐦", "🕊️", "🎁",
];

export function IconPicker({ name, defaultValue }: { name: string; defaultValue?: string | null }) {
  const [value, setValue] = useState(defaultValue || ICON_OPTIONS[0]);
  return (
    <div>
      <Label>الأيقونة</Label>
      <input type="hidden" name={name} value={value} />
      <div className="grid grid-cols-10 gap-1 rounded-(--radius-sm) border border-line bg-surface-sunken p-(--space-2)">
        {ICON_OPTIONS.map((icon) => (
          <button
            key={icon}
            type="button"
            onClick={() => setValue(icon)}
            className={`flex h-8 w-8 items-center justify-center rounded-(--radius-xs) text-lg transition-colors ${
              value === icon ? "bg-brand text-on-brand shadow-brutal-sm" : "bg-surface-raised hover:bg-surface"
            }`}
          >
            {icon}
          </button>
        ))}
      </div>
    </div>
  );
}
