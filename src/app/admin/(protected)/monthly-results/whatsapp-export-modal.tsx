"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getPeriodResultsForExportAction, type CircleResultsGroup } from "./actions";
import { Download, X } from "lucide-react";
import { LottieLoader } from "@/components/ui/lottie-loader";

const BRAND = "#0e6b4f";
const BRAND_HOVER = "#0b5640";
const SURFACE = "#f7f7f3";
const SURFACE_RAISED = "#ffffff";
const INK = "#171b18";
const INK_MUTED = "#5c6862";
const ACCENT_SOLID = "#bc9b6a";
const DANGER = "#c4362a";
const WARNING = "#9a5b09";

const FONT = '"IBM Plex Sans Arabic", "IBM Plex Sans", "Segoe UI", sans-serif';

function percentageColor(pct: number) {
  if (pct >= 90) return BRAND;
  if (pct >= 75) return ACCENT_SOLID;
  if (pct >= 60) return WARNING;
  return DANGER;
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" });
  } catch {
    return dateStr;
  }
}

function drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawCircleImage(
  canvas: HTMLCanvasElement,
  opts: {
    programName: string;
    mosqueName: string;
    circleName: string;
    periodLabel: string;
    examDate: string | null;
    students: { name: string; percentage: number | null; statusText: string | null }[];
  }
) {
  const { programName, mosqueName, circleName, periodLabel, examDate, students } = opts;
  const width = 900;
  const rowHeight = 64;
  const headerHeight = 260;
  const footerHeight = 70;
  const height = headerHeight + students.length * rowHeight + footerHeight;

  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // background
  ctx.fillStyle = SURFACE;
  ctx.fillRect(0, 0, width, height);

  // header banner
  ctx.fillStyle = BRAND;
  ctx.fillRect(0, 0, width, headerHeight);
  ctx.fillStyle = BRAND_HOVER;
  ctx.fillRect(0, headerHeight - 8, width, 8);

  ctx.textAlign = "center";
  ctx.direction = "rtl";

  ctx.fillStyle = "#ffffff";
  ctx.font = `700 26px ${FONT}`;
  ctx.fillText(programName, width / 2, 56);

  ctx.font = `400 16px ${FONT}`;
  ctx.globalAlpha = 0.85;
  ctx.fillText(mosqueName, width / 2, 84);
  ctx.globalAlpha = 1;

  ctx.font = `800 40px ${FONT}`;
  ctx.fillText(`حلقة ${circleName}`, width / 2, 148);

  ctx.font = `600 22px ${FONT}`;
  ctx.fillText(`النتائج الشهرية · ${periodLabel}`, width / 2, 188);

  if (examDate) {
    ctx.font = `400 16px ${FONT}`;
    ctx.globalAlpha = 0.85;
    ctx.fillText(`تاريخ الاختبار: ${formatDate(examDate)}`, width / 2, 216);
    ctx.globalAlpha = 1;
  }

  // table
  const tableX = 40;
  const tableW = width - 80;
  let y = headerHeight + 10;

  students.forEach((s, i) => {
    const rowY = y + i * rowHeight;
    ctx.fillStyle = i % 2 === 0 ? SURFACE_RAISED : SURFACE;
    drawRoundedRect(ctx, tableX, rowY + 6, tableW, rowHeight - 12, 10);
    ctx.fill();

    // rank badge
    ctx.fillStyle = INK_MUTED;
    ctx.font = `600 15px ${FONT}`;
    ctx.textAlign = "right";
    ctx.fillText(String(i + 1), width - 60, rowY + rowHeight / 2 + 6);

    // name
    ctx.fillStyle = INK;
    ctx.font = `700 20px ${FONT}`;
    ctx.textAlign = "right";
    ctx.fillText(s.name, width - 90, rowY + rowHeight / 2 + 7);

    // percentage pill
    const pillW = 90;
    const pillH = 36;
    const pillX = tableX + 20;
    const pillY = rowY + (rowHeight - pillH) / 2 + 6;
    ctx.fillStyle = s.percentage === null ? INK_MUTED : percentageColor(s.percentage);
    drawRoundedRect(ctx, pillX, pillY, pillW, pillH, pillH / 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = `700 18px ${FONT}`;
    ctx.textAlign = "center";
    ctx.fillText(s.percentage === null ? (s.statusText ?? "—") : `${s.percentage}%`, pillX + pillW / 2, pillY + pillH / 2 + 6);
  });

  // footer
  ctx.fillStyle = BRAND;
  ctx.fillRect(0, height - footerHeight, width, footerHeight);
  ctx.fillStyle = "#ffffff";
  ctx.font = `600 15px ${FONT}`;
  ctx.textAlign = "center";
  ctx.globalAlpha = 0.9;
  ctx.fillText(`عدد الطلاب: ${students.length} · بارك الله في جهدهم`, width / 2, height - footerHeight / 2 + 5);
  ctx.globalAlpha = 1;
}

export function WhatsappExportModal({
  seasonId,
  periodLabel,
  programName,
  mosqueName,
  onClose,
}: {
  seasonId: string;
  periodLabel: string;
  programName: string;
  mosqueName: string;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [examDate, setExamDate] = useState<string | null>(null);
  const [groups, setGroups] = useState<CircleResultsGroup[]>([]);
  const canvasRefs = useRef<Record<string, HTMLCanvasElement | null>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const fontReady = "fonts" in document ? document.fonts.load('700 24px "IBM Plex Sans Arabic"') : Promise.resolve();
      const [res] = await Promise.all([getPeriodResultsForExportAction(seasonId, periodLabel), fontReady.catch(() => {})]);
      if (cancelled) return;
      setExamDate(res.examDate);
      setGroups(res.groups);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [seasonId, periodLabel]);

  useEffect(() => {
    if (loading) return;
    for (const group of groups) {
      const canvas = canvasRefs.current[group.circleName];
      if (canvas) {
        drawCircleImage(canvas, { programName, mosqueName, circleName: group.circleName, periodLabel, examDate, students: group.students });
      }
    }
  }, [loading, groups, programName, mosqueName, periodLabel, examDate]);

  const downloadCircle = (circleName: string) => {
    const canvas = canvasRefs.current[circleName];
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `نتائج_${periodLabel}_${circleName}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const downloadAll = () => {
    groups.forEach((g, i) => setTimeout(() => downloadCircle(g.circleName), i * 350));
  };

  return (
    <div className="fixed inset-0 z-50 bg-ink/60 flex items-center justify-center p-(--space-4)" onClick={onClose}>
      <div
        className="bg-surface-raised rounded-(--radius-lg) border-bold border-line-strong max-w-[720px] w-full max-h-[85vh] overflow-y-auto p-(--space-6)"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-(--space-4)">
          <div>
            <CardTitle>مشاركة النتائج عبر واتساب</CardTitle>
            <CardDescription>{periodLabel} — صورة منفصلة لكل حلقة</CardDescription>
          </div>
          <Button size="sm" variant="outline" onClick={onClose}>
            <X size={14} />
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-(--space-8)">
            <LottieLoader size={80} label="جارِ تجهيز الصور..." />
          </div>
        ) : groups.length === 0 ? (
          <p className="text-sm text-ink-muted text-center py-(--space-8)">لا توجد نتائج لهذه الفترة.</p>
        ) : (
          <>
            <div className="flex justify-end mb-(--space-3)">
              <Button size="sm" onClick={downloadAll}>
                <Download size={14} /> تحميل كل الصور
              </Button>
            </div>
            <div className="space-y-(--space-5)">
              {groups.map((g) => (
                <Card key={g.circleName}>
                  <div className="flex items-center justify-between mb-(--space-3)">
                    <p className="text-sm font-bold text-ink">حلقة {g.circleName}</p>
                    <Button size="sm" variant="outline" onClick={() => downloadCircle(g.circleName)}>
                      <Download size={13} /> تحميل الصورة
                    </Button>
                  </div>
                  <div className="rounded-(--radius-md) overflow-hidden border border-line">
                    <canvas
                      ref={(el) => {
                        canvasRefs.current[g.circleName] = el;
                      }}
                      className="w-full h-auto block"
                    />
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
