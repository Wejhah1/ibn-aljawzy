"use client";

import { type ReactNode } from "react";
import { X } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/card";

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
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-ink/40 p-0 md:p-(--space-6)">
      <Card
        className="w-full max-h-[92vh] overflow-y-auto rounded-b-none md:rounded-(--radius-lg) shadow-brutal"
        style={{ maxWidth }}
      >
        <div className="flex items-center justify-between mb-(--space-4)">
          <CardTitle>{title}</CardTitle>
          <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-(--radius-sm) hover:bg-surface-sunken">
            <X size={18} />
          </button>
        </div>
        {children}
      </Card>
    </div>
  );
}
