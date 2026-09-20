"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BarcodeScannerModal } from "@/components/scanner/barcode-scanner-modal";
import {
  searchStudentsAction,
  getStudentQuickCardAction,
  quickMarkAttendanceAction,
  quickAddPointsAction,
  type StudentSearchResult,
  type QuickCardData,
} from "./actions";
import { ScanLine, Search, CheckCircle2, XCircle, Clock, FileWarning, Plus, Minus, Users } from "lucide-react";

const POINT_AMOUNTS = [1, 5, 10, 25];

const ATTENDANCE_OPTIONS: { value: "present" | "late" | "excused" | "absent"; label: string; icon: typeof CheckCircle2; tone: string }[] = [
  { value: "present", label: "حاضر", icon: CheckCircle2, tone: "success" },
  { value: "late", label: "متأخر", icon: Clock, tone: "warning" },
  { value: "excused", label: "بعذر", icon: FileWarning, tone: "info" },
  { value: "absent", label: "غائب", icon: XCircle, tone: "danger" },
];

export function QuickOpsClient() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<StudentSearchResult[]>([]);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      const r = await searchStudentsAction(query);
      setResults(r);
    }, 250);
  }, [query]);

  if (selectedId) {
    return <StudentQuickCard studentId={selectedId} onBack={() => setSelectedId(null)} />;
  }

  return (
    <main className="p-(--space-4) md:p-(--space-8) max-w-[700px] mx-auto pb-24">
      <h1 className="text-[22px] leading-[30px] font-bold text-ink mb-(--space-6)">العمليات السريعة</h1>

      <div className="flex gap-(--space-3) mb-(--space-4)">
        <div className="relative flex-1">
          <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث بالاسم أو الكود..."
            className="h-14 pr-11 text-base"
            autoFocus
          />
        </div>
        <Button size="icon" className="h-14 w-14 shrink-0" onClick={() => setScannerOpen(true)}>
          <ScanLine size={22} />
        </Button>
      </div>

      <div className="space-y-(--space-2)">
        {results.map((s) => (
          <button
            key={s.id}
            onClick={() => setSelectedId(s.id)}
            className="w-full text-right"
          >
            <Card className="flex items-center gap-(--space-3) hover:bg-surface-sunken transition-colors min-h-[64px]">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-soft text-brand-hover font-bold shrink-0">
                {s.full_name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-(--space-2)">
                  <p className="text-sm font-semibold text-ink truncate">{s.full_name}</p>
                  <Badge tone="neutral">#{s.code}</Badge>
                </div>
                {s.circle_name && <p className="text-[12px] text-ink-muted truncate">{s.circle_name}</p>}
              </div>
            </Card>
          </button>
        ))}
        {query && results.length === 0 && (
          <Card>
            <CardDescription>لا نتائج مطابقة.</CardDescription>
          </Card>
        )}
      </div>

      {scannerOpen && (
        <BarcodeScannerModal
          onClose={() => setScannerOpen(false)}
          onDetect={async (code) => {
            setScannerOpen(false);
            const matches = await searchStudentsAction(code);
            const exact = matches.find((m) => m.code === code) ?? matches[0];
            if (exact) setSelectedId(exact.id);
          }}
        />
      )}
    </main>
  );
}

function StudentQuickCard({ studentId, onBack }: { studentId: string; onBack: () => void }) {
  const [data, setData] = useState<QuickCardData | null>(null);
  const [flashMessage, setFlashMessage] = useState<string | null>(null);

  const reload = async () => {
    const d = await getStudentQuickCardAction(studentId);
    setData(d);
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  const flash = (msg: string) => {
    setFlashMessage(msg);
    setTimeout(() => setFlashMessage(null), 1500);
  };

  const markAttendance = (status: "present" | "late" | "excused" | "absent") => {
    if (!data?.programDayId) return;
    setData((prev) => (prev ? { ...prev, todayStatus: status } : prev));
    flash("تم تسجيل الحضور");
    quickMarkAttendanceAction(studentId, data.programDayId, status).then((res) => {
      if (res.data) setData(res.data);
    });
  };

  const addPoints = (amount: number) => {
    if (!data?.seasonId) return;
    setData((prev) => (prev ? { ...prev, totalPoints: prev.totalPoints + amount } : prev));
    flash(amount > 0 ? `+${amount} نقطة` : `${amount} نقطة`);
    quickAddPointsAction(studentId, data.seasonId, amount).then((res) => {
      if (res.data) setData(res.data);
    });
  };

  if (!data) {
    return (
      <main className="p-(--space-4) md:p-(--space-8) max-w-[700px] mx-auto">
        <CardDescription>جارِ التحميل...</CardDescription>
      </main>
    );
  }

  return (
    <main className="p-(--space-4) md:p-(--space-8) max-w-[700px] mx-auto pb-24">
      <button onClick={onBack} className="text-[13px] font-semibold text-ink-muted hover:text-ink mb-(--space-4)">
        ← عودة للبحث
      </button>

      <Card className="mb-(--space-4) shadow-brutal-sm text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-soft text-brand-hover font-bold text-3xl mx-auto mb-(--space-3)">
          {data.student.full_name.charAt(0)}
        </div>
        <h2 className="text-[20px] font-bold text-ink">{data.student.full_name}</h2>
        <p className="text-sm text-ink-muted mt-1">
          <Badge tone="neutral">#{data.student.code}</Badge>
          {data.circleName && (
            <span className="mr-2 inline-flex items-center gap-1">
              <Users size={12} /> {data.circleName} {data.groupName ? `· ${data.groupName}` : ""}
            </span>
          )}
        </p>
        <div className="mt-(--space-4) inline-flex items-center gap-2 rounded-(--radius-sm) bg-brand text-on-brand px-(--space-4) py-(--space-2) border-bold border-line-strong shadow-brutal-sm">
          <span className="text-[28px] font-bold">{data.totalPoints}</span>
          <span className="text-sm font-semibold">نقطة</span>
        </div>
      </Card>

      {flashMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-ink text-surface px-(--space-4) py-(--space-2) rounded-(--radius-sm) text-sm font-bold shadow-brutal">
          {flashMessage}
        </div>
      )}

      <Card className="mb-(--space-4)">
        <p className="text-[13px] font-bold text-ink mb-(--space-3)">حضور اليوم</p>
        {!data.programDayId ? (
          <CardDescription>اليوم ليس يوم برنامج في الموسم الحالي.</CardDescription>
        ) : (
          <div className="grid grid-cols-2 gap-(--space-2)">
            {ATTENDANCE_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const active = data.todayStatus === opt.value;
              return (
                <button
                  key={opt.value}
                  
                  onClick={() => markAttendance(opt.value)}
                  className={`min-h-[56px] rounded-(--radius-sm) border-bold flex items-center justify-center gap-2 font-bold text-sm transition-all ${
                    active
                      ? "border-line-strong shadow-brutal-sm"
                      : "bg-surface-raised text-ink border-line-strong hover:bg-surface-sunken"
                  }`}
                  style={
                    active
                      ? {
                          backgroundColor: `var(--color-${opt.tone})`,
                          color: `var(--color-on-${opt.tone})`,
                        }
                      : undefined
                  }
                >
                  <Icon size={18} /> {opt.label}
                </button>
              );
            })}
          </div>
        )}
      </Card>

      {data.seasonId && (
        <Card>
          <p className="text-[13px] font-bold text-ink mb-(--space-3)">إضافة نقاط</p>
          <div className="grid grid-cols-4 gap-(--space-2) mb-(--space-2)">
            {POINT_AMOUNTS.map((amt) => (
              <button
                key={`add-${amt}`}
                
                onClick={() => addPoints(amt)}
                className="min-h-[52px] rounded-(--radius-sm) border-bold border-line-strong bg-brand-soft text-brand-hover font-bold text-base flex items-center justify-center gap-1 hover:bg-brand hover:text-on-brand transition-colors"
              >
                <Plus size={14} /> {amt}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-4 gap-(--space-2)">
            {POINT_AMOUNTS.map((amt) => (
              <button
                key={`sub-${amt}`}
                
                onClick={() => addPoints(-amt)}
                className="min-h-[52px] rounded-(--radius-sm) border-bold border-line-strong bg-danger-soft text-danger font-bold text-base flex items-center justify-center gap-1 hover:bg-danger hover:text-on-danger transition-colors"
              >
                <Minus size={14} /> {amt}
              </button>
            ))}
          </div>
        </Card>
      )}
    </main>
  );
}
