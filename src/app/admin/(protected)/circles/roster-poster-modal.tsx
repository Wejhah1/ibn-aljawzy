"use client";

import { useEffect, useRef, useState } from "react";
import { toPng } from "html-to-image";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { getRosterAction } from "./actions";
import type { ProgramInfo } from "@/lib/settings";

const TONE: Record<string, string> = {
  "group-1": "var(--color-group-1-fg)",
  "group-2": "var(--color-group-2-fg)",
  "group-3": "var(--color-group-3-fg)",
  "group-4": "var(--color-group-4-fg)",
  "group-5": "var(--color-group-5-fg)",
  "group-6": "var(--color-group-6-fg)",
};

export function RosterPosterModal({
  kind,
  id,
  name,
  leaderName,
  colorToken,
  programInfo,
  onClose,
}: {
  kind: "circle" | "group";
  id: string;
  name: string;
  leaderName: string | null;
  colorToken: string;
  programInfo: ProgramInfo;
  onClose: () => void;
}) {
  const [students, setStudents] = useState<{ full_name: string; code: string }[] | null>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  const accent = TONE[colorToken] ?? TONE["group-1"];

  useEffect(() => {
    getRosterAction(kind, id).then((r) => setStudents(r.students));
  }, [kind, id]);

  const handleExport = async () => {
    if (!exportRef.current) return;
    const dataUrl = await toPng(exportRef.current, { pixelRatio: 2, backgroundColor: "#f7f7f3" });
    const link = document.createElement("a");
    link.download = `${name}.png`;
    link.href = dataUrl;
    link.click();
  };

  return (
    <Modal title={`${kind === "circle" ? "حلقة" : "مجموعة"} ${name}`} onClose={onClose}>
      <div className="space-y-(--space-4)">
        {students === null ? (
          <div className="flex items-center justify-center py-(--space-8) text-ink-faint">
            <Loader2 size={20} className="animate-spin" />
          </div>
        ) : (
          <>
            <div className="rounded-(--radius-sm) border border-line overflow-hidden max-h-[300px] overflow-y-auto">
              {students.length === 0 ? (
                <p className="text-sm text-ink-muted p-(--space-4) text-center">لا يوجد طلاب في هذا التصنيف بعد.</p>
              ) : (
                students.map((s, i) => (
                  <div
                    key={s.code}
                    className={`flex items-center justify-between px-(--space-3) py-(--space-2) text-sm ${
                      i % 2 === 0 ? "bg-surface-raised" : "bg-surface-sunken"
                    }`}
                  >
                    <span className="font-semibold text-ink">{s.full_name}</span>
                    <span className="text-ink-faint font-mono text-[12px]">#{s.code}</span>
                  </div>
                ))
              )}
            </div>
            <Button size="sm" variant="secondary" className="w-full" onClick={handleExport} disabled={students.length === 0}>
              <Download size={14} /> تصدير كصورة جاهزة للطباعة/المشاركة
            </Button>
          </>
        )}
      </div>

      {/* لوحة التصدير المخفية */}
      <div className="fixed -left-[9999px] top-0">
        <div ref={exportRef} style={{ width: 900, padding: 56 }} className="bg-surface flex flex-col">
          <div className="flex items-center justify-between mb-8 pb-8" style={{ borderBottom: `3px solid ${accent}` }}>
            <div>
              <p className="text-[13px] font-bold text-ink-muted mb-1">{programInfo.program_name} · {programInfo.mosque_name}</p>
              <p className="text-[40px] font-bold text-ink">{name}</p>
              {leaderName && <p className="text-[20px] text-ink-muted mt-1">المعلم: {leaderName}</p>}
            </div>
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-surface-raised border-[3px] border-ink shadow-[6px_6px_0_0_#171b18] overflow-hidden p-1.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.svg" alt="" className="h-full w-full object-contain" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {(students ?? []).map((s, i) => (
              <div
                key={s.code}
                className="flex items-center gap-3 rounded-xl border-2 border-ink px-5 py-3"
                style={{ backgroundColor: i % 2 === 0 ? "#ffffff" : "#f7f7f3" }}
              >
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-full text-[13px] font-bold text-white shrink-0"
                  style={{ backgroundColor: accent }}
                >
                  {i + 1}
                </span>
                <p className="text-[19px] font-bold text-ink">{s.full_name}</p>
              </div>
            ))}
          </div>
          <p className="text-[13px] text-ink-faint text-left mt-8">{(students ?? []).length} طالب</p>
        </div>
      </div>
    </Modal>
  );
}
