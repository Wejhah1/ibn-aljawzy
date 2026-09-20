"use client";

import { useState } from "react";
import { Label } from "@/components/ui/input";

const TOKENS = ["group-1", "group-2", "group-3", "group-4", "group-5", "group-6"];
const SWATCH: Record<string, string> = {
  "group-1": "var(--color-group-1-fg)",
  "group-2": "var(--color-group-2-fg)",
  "group-3": "var(--color-group-3-fg)",
  "group-4": "var(--color-group-4-fg)",
  "group-5": "var(--color-group-5-fg)",
  "group-6": "var(--color-group-6-fg)",
};

export function ColorTokenPicker({ name, defaultValue }: { name: string; defaultValue?: string }) {
  const [value, setValue] = useState(defaultValue || TOKENS[0]);
  return (
    <div>
      <Label>اللون</Label>
      <input type="hidden" name={name} value={value} />
      <div className="flex items-center gap-(--space-2)">
        {TOKENS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setValue(t)}
            className="h-9 w-9 rounded-full shrink-0 flex items-center justify-center transition-transform"
            style={{
              backgroundColor: SWATCH[t],
              border: value === t ? "2.5px solid var(--color-ink)" : "2.5px solid transparent",
              transform: value === t ? "scale(1.1)" : undefined,
            }}
            title={t}
          />
        ))}
      </div>
    </div>
  );
}
