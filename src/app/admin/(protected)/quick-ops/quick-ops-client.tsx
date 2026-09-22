"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { BarcodeScannerModal } from "@/components/scanner/barcode-scanner-modal";
import {
  searchStudentsAction,
  getStudentQuickCardAction,
  quickMarkAttendanceAction,
  quickAddPointsAction,
  getActiveBadgesAction,
  quickGrantBadgeAction,
  quickSendNoteAction,
  type StudentSearchResult,
  type QuickCardData,
  type QuickBadgeOption,
} from "./actions";
import { ScanLine, Search, CheckCircle2, XCircle, Clock, FileWarning, Plus, Minus, Users, MessageCircle, Award, Send } from "lucide-react";

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
  const [badgeModalOpen, setBadgeModalOpen] = useState(false);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [pointsModalOpen, setPointsModalOpen] = useState(false);

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

  const addPoints = (amount: number, reason?: string) => {
    if (!data?.seasonId) return;
    setData((prev) => (prev ? { ...prev, totalPoints: prev.totalPoints + amount } : prev));
    flash(amount > 0 ? `+${amount} نقطة` : `${amount} نقطة`);
    quickAddPointsAction(studentId, data.seasonId, amount, reason).then((res) => {
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

        <div className="mt-(--space-4) flex items-center gap-(--space-2)">
          <a
            href={data.waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 h-11 flex items-center justify-center gap-1.5 rounded-(--radius-sm) border-bold border-line-strong text-brand text-[13px] font-bold hover:bg-brand-soft transition-colors"
          >
            <MessageCircle size={16} /> تواصل واتساب
          </a>
          <button
            onClick={() => setBadgeModalOpen(true)}
            className="flex-1 h-11 flex items-center justify-center gap-1.5 rounded-(--radius-sm) border-bold border-line-strong text-accent text-[13px] font-bold hover:bg-accent-soft transition-colors"
          >
            <Award size={16} /> منح وسام
          </button>
          <button
            onClick={() => setNoteModalOpen(true)}
            className="flex-1 h-11 flex items-center justify-center gap-1.5 rounded-(--radius-sm) border-bold border-line-strong text-info text-[13px] font-bold hover:bg-info-soft transition-colors relative"
          >
            <Send size={16} /> ملاحظة
            {data.hasUnreadNote && <span className="absolute -top-1 -left-1 h-2.5 w-2.5 rounded-full bg-danger" />}
          </button>
        </div>
      </Card>

      <AnimatePresence>
        {flashMessage && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-ink text-surface px-(--space-4) py-(--space-2) rounded-(--radius-sm) text-sm font-bold shadow-brutal"
          >
            {flashMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {badgeModalOpen && (
        <QuickBadgeModal
          studentId={studentId}
          onClose={() => setBadgeModalOpen(false)}
          onGranted={(name) => {
            flash(`تم منح وسام "${name}"`);
            setBadgeModalOpen(false);
          }}
        />
      )}
      {noteModalOpen && (
        <QuickNoteModal
          studentId={studentId}
          onClose={() => setNoteModalOpen(false)}
          onSent={() => {
            flash("تم إرسال الملاحظة");
            setNoteModalOpen(false);
          }}
        />
      )}
      {pointsModalOpen && (
        <QuickPointsModal
          onClose={() => setPointsModalOpen(false)}
          onSubmit={(amount, reason) => {
            addPoints(amount, reason || undefined);
            setPointsModalOpen(false);
          }}
        />
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
          <button
            onClick={() => setPointsModalOpen(true)}
            className="mt-(--space-2) w-full min-h-[44px] rounded-(--radius-sm) border-bold border-line-strong bg-surface-raised text-ink font-bold text-sm hover:bg-surface-sunken transition-colors"
          >
            نقاط مخصصة وسبب...
          </button>
        </Card>
      )}
    </main>
  );
}

function QuickPointsModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (amount: number, reason: string) => void;
}) {
  const [amountText, setAmountText] = useState("");
  const [reason, setReason] = useState("");

  const amount = Number(amountText);
  const isValid = amountText.trim() !== "" && Number.isFinite(amount) && Number.isInteger(amount) && amount !== 0;

  return (
    <Modal title="نقاط مخصصة" onClose={onClose}>
      <div className="space-y-(--space-4)">
        <div>
          <label className="block text-[13px] font-bold text-ink mb-(--space-2)">عدد النقاط (استخدم إشارة سالبة للخصم)</label>
          <Input
            type="number"
            value={amountText}
            onChange={(e) => setAmountText(e.target.value)}
            placeholder="مثال: 15 أو -5"
            autoFocus
          />
        </div>
        <div>
          <label className="block text-[13px] font-bold text-ink mb-(--space-2)">السبب (يظهر لولي الأمر)</label>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="اكتب سبب إضافة/خصم النقاط..." />
        </div>
        <div className="flex justify-end gap-(--space-2)">
          <Button type="button" variant="ghost" onClick={onClose}>
            إلغاء
          </Button>
          <Button type="button" disabled={!isValid} onClick={() => onSubmit(amount, reason.trim())}>
            حفظ
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function QuickBadgeModal({
  studentId,
  onClose,
  onGranted,
}: {
  studentId: string;
  onClose: () => void;
  onGranted: (badgeName: string) => void;
}) {
  const [badges, setBadges] = useState<QuickBadgeOption[] | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  useEffect(() => {
    getActiveBadgesAction().then(setBadges);
  }, []);

  const grant = async (b: QuickBadgeOption) => {
    setPendingId(b.id);
    const result = await quickGrantBadgeAction(studentId, b.id);
    setPendingId(null);
    if (!result?.error) onGranted(b.name);
  };

  return (
    <Modal title="منح وسام" onClose={onClose}>
      {badges === null ? (
        <p className="text-sm text-ink-muted text-center py-(--space-6)">جارِ التحميل...</p>
      ) : badges.length === 0 ? (
        <CardDescription>لا توجد أوسمة فعّالة بعد.</CardDescription>
      ) : (
        <div className="grid grid-cols-2 gap-(--space-2)">
          {badges.map((b) => (
            <button
              key={b.id}
              onClick={() => grant(b)}
              disabled={pendingId === b.id}
              className="flex items-center gap-(--space-2) rounded-(--radius-sm) border-bold border-line-strong px-(--space-3) py-(--space-3) hover:bg-accent-soft transition-colors text-right"
            >
              <span className="text-2xl">{b.icon || "🏅"}</span>
              <span className="text-sm font-bold text-ink">{b.name}</span>
            </button>
          ))}
        </div>
      )}
    </Modal>
  );
}

function QuickNoteModal({ studentId, onClose, onSent }: { studentId: string; onClose: () => void; onSent: () => void }) {
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  const send = async () => {
    if (!message.trim()) return;
    setPending(true);
    const result = await quickSendNoteAction(studentId, message);
    setPending(false);
    if (!result?.error) onSent();
  };

  return (
    <Modal title="إرسال ملاحظة لولي الأمر" onClose={onClose}>
      <div className="space-y-(--space-4)">
        <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} placeholder="اكتب ملاحظتك هنا..." autoFocus />
        <div className="flex justify-end gap-(--space-2)">
          <Button type="button" variant="ghost" onClick={onClose}>
            إلغاء
          </Button>
          <Button type="button" disabled={!message.trim() || pending} onClick={send}>
            <Send size={14} /> {pending ? "جارِ الإرسال..." : "إرسال"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
