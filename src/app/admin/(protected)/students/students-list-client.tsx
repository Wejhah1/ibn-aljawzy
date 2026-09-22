"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { BadgeStrip, type BadgeStripItem } from "@/components/badges/badge-strip";
import { buildWaMeLink, fillTemplate } from "@/lib/whatsapp";
import type { ProgramInfo } from "@/lib/settings";
import { bulkDropoutAction, bulkDeleteStudentsAction, deleteStudentAction } from "./actions";
import {
  Search,
  Plus,
  MessageCircle,
  UserX,
  MessageSquare,
  CheckSquare,
  Square,
  Trash2,
  Eye,
  CalendarCheck,
  CalendarX,
  Trophy,
} from "lucide-react";

interface Row {
  id: string;
  code: string;
  fullName: string;
  guardianName: string | null;
  guardianPhone: string;
  status: string;
  circleName: string | null;
  circleColor: string | null;
  groupName: string | null;
  groupColor: string | null;
  points: number;
  presentCount: number;
  absentCount: number;
  hasUnreadNote: boolean;
  badges: BadgeStripItem[];
}

const TONE: Record<string, { fg: string; bg: string }> = {
  "group-1": { fg: "var(--color-group-1-fg)", bg: "var(--color-group-1-bg)" },
  "group-2": { fg: "var(--color-group-2-fg)", bg: "var(--color-group-2-bg)" },
  "group-3": { fg: "var(--color-group-3-fg)", bg: "var(--color-group-3-bg)" },
  "group-4": { fg: "var(--color-group-4-fg)", bg: "var(--color-group-4-bg)" },
  "group-5": { fg: "var(--color-group-5-fg)", bg: "var(--color-group-5-bg)" },
  "group-6": { fg: "var(--color-group-6-fg)", bg: "var(--color-group-6-bg)" },
};

function ColorTag({ label, token }: { label: string; token: string | null }) {
  if (!label) return <span className="text-ink-faint min-w-0">—</span>;
  const tone = token ? TONE[token] : undefined;
  return (
    <span
      className="flex items-center gap-1.5 rounded-(--radius-xs) px-2 py-1 text-[12px] font-semibold min-w-0 w-fit max-w-full"
      style={tone ? { color: tone.fg, backgroundColor: tone.bg } : undefined}
    >
      {tone && <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: tone.fg }} />}
      <span className="truncate min-w-0">{label}</span>
    </span>
  );
}

export function StudentsListClient({
  rows,
  circles,
  q,
  status,
  circle,
  programInfo,
  template,
}: {
  rows: Row[];
  circles: { id: string; name: string }[];
  q: string;
  status: string;
  circle: string;
  programInfo: ProgramInfo;
  template: string;
}) {
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkDropoutOpen, setBulkDropoutOpen] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Row | null>(null);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [qInput, setQInput] = useState(q);
  const [isPending, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setQInput(q);
  }, [q]);

  const updateParams = (next: { q?: string; status?: string; circle?: string }) => {
    const params = new URLSearchParams(searchParams.toString());
    const merged = { q, status, circle, ...next };
    for (const [key, value] of Object.entries(merged)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
  };

  const onSearchChange = (value: string) => {
    setQInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => updateParams({ q: value }), 300);
  };

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allSelected = rows.length > 0 && selected.size === rows.length;
  const toggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(rows.map((r) => r.id)));
  };

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelected(new Set());
  };

  return (
    <main className="p-(--space-4) md:p-(--space-8) max-w-[1200px] mx-auto pb-24">
      <div className="flex items-center justify-between mb-(--space-6) flex-wrap gap-(--space-3)">
        <div>
          <h1 className="text-[22px] leading-[30px] font-bold text-ink">الطلاب</h1>
          <p className="text-sm text-ink-muted mt-1">{rows.length} طالب</p>
        </div>
        <div className="flex items-center gap-(--space-2)">
          <Button
            variant={selectMode ? "secondary" : "outline"}
            onClick={selectMode ? exitSelectMode : () => setSelectMode(true)}
          >
            <CheckSquare size={16} /> {selectMode ? "إلغاء التحديد" : "تحديد متعدد"}
          </Button>
          <Link href="/admin/students/new">
            <Button>
              <Plus size={16} /> طالب جديد
            </Button>
          </Link>
        </div>
      </div>

      <Card className="mb-(--space-4) flex flex-col sm:flex-row gap-(--space-3)">
        <div className="relative flex-1">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint" />
          <Input
            value={qInput}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="الاسم أو الكود أو جوال ولي الأمر"
            className="pr-9"
          />
        </div>
        <select
          value={status}
          onChange={(e) => updateParams({ status: e.target.value })}
          className="h-11 rounded-(--radius-sm) border border-line bg-surface-raised px-(--space-3) text-sm font-medium text-ink"
        >
          <option value="active">نشط فقط</option>
          <option value="dropped_out">المنقطعون فقط</option>
          <option value="all">الكل</option>
        </select>
        <select
          value={circle}
          onChange={(e) => updateParams({ circle: e.target.value })}
          className="h-11 rounded-(--radius-sm) border border-line bg-surface-raised px-(--space-3) text-sm font-medium text-ink"
        >
          <option value="">كل الحلقات</option>
          {circles.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </Card>

      {selectMode && (
        <button
          onClick={toggleAll}
          className="flex items-center gap-2 text-sm font-bold text-brand mb-(--space-3) hover:underline"
        >
          {allSelected ? <CheckSquare size={18} /> : <Square size={18} />} تحديد الكل ({rows.length})
        </button>
      )}

      {rows.length === 0 && (
        <Card>
          <CardDescription>لا يوجد طلاب مطابقون.</CardDescription>
        </Card>
      )}

      <div className={isPending ? "opacity-60 transition-opacity" : "transition-opacity"}>

      {/* ---------- سطح المكتب: جدول حقيقي يضمن محاذاة الأعمدة عبر كل الصفوف ---------- */}
      {rows.length > 0 && (
        <div className="hidden md:block overflow-x-auto rounded-(--radius-md) border-bold border-line bg-surface-raised">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-line text-[11px] font-bold text-ink-faint uppercase tracking-wide">
                {selectMode && <th className="w-11 px-(--space-2) py-(--space-3)" />}
                <th className="text-right px-(--space-3) py-(--space-3) font-bold">اسم الطالب</th>
                <th className="text-right px-(--space-3) py-(--space-3) font-bold">الحلقة</th>
                <th className="text-right px-(--space-3) py-(--space-3) font-bold">المجموعة</th>
                <th className="text-center px-(--space-2) py-(--space-3) font-bold">النقاط</th>
                <th className="text-center px-(--space-2) py-(--space-3) font-bold">الحضور</th>
                <th className="text-center px-(--space-2) py-(--space-3) font-bold">الغياب</th>
                <th className="w-11 px-(--space-1) py-(--space-3)" />
                <th className="w-11 px-(--space-1) py-(--space-3)" />
                <th className="w-11 px-(--space-1) py-(--space-3)" />
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => {
                const message = fillTemplate(template, {
                  name: s.fullName,
                  barcode: s.code,
                  program: programInfo.program_name,
                  mosque: programInfo.mosque_name,
                });
                const isSelected = selected.has(s.id);
                const waLink = buildWaMeLink(s.guardianPhone, message);

                return (
                  <motion.tr
                    key={s.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.16 }}
                    className="border-b border-line last:border-b-0 hover:bg-surface-sunken transition-colors"
                  >
                    {selectMode && (
                      <td className="px-(--space-2) py-(--space-2) text-center">
                        <button onClick={() => toggle(s.id)} className="text-brand">
                          {isSelected ? <CheckSquare size={20} /> : <Square size={20} className="text-ink-faint" />}
                        </button>
                      </td>
                    )}
                    <td className="px-(--space-3) py-(--space-2)">
                      <div className="flex items-center gap-(--space-2) min-w-0">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-soft text-brand-hover font-bold text-sm shrink-0">
                          {s.fullName.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="text-sm font-semibold text-ink truncate">{s.fullName}</p>
                            <BadgeStrip badges={s.badges} max={2} />
                            {s.status === "dropped_out" && (
                              <Badge tone="danger">
                                <UserX size={11} /> منقطع
                              </Badge>
                            )}
                            {s.hasUnreadNote && (
                              <Badge tone="warning">
                                <MessageSquare size={11} />
                              </Badge>
                            )}
                          </div>
                          <p className="text-[11px] text-ink-faint truncate">#{s.code}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-(--space-3) py-(--space-2)">
                      <ColorTag label={s.circleName ?? ""} token={s.circleColor} />
                    </td>
                    <td className="px-(--space-3) py-(--space-2)">
                      <ColorTag label={s.groupName ?? ""} token={s.groupColor} />
                    </td>
                    <td className="px-(--space-2) py-(--space-2) text-center whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-sm font-bold text-brand">
                        <Trophy size={13} /> {s.points}
                      </span>
                    </td>
                    <td className="px-(--space-2) py-(--space-2) text-center text-sm font-semibold" style={{ color: "var(--color-success)" }}>
                      {s.presentCount}
                    </td>
                    <td className="px-(--space-2) py-(--space-2) text-center text-sm font-semibold" style={{ color: "var(--color-danger)" }}>
                      {s.absentCount}
                    </td>
                    <td className="px-(--space-1) py-(--space-2) text-center">
                      <a
                        href={waLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-10 w-10 items-center justify-center rounded-(--radius-sm) border border-line text-brand hover:bg-brand-soft transition-colors"
                        title="تواصل عبر واتساب"
                      >
                        <MessageCircle size={16} />
                      </a>
                    </td>
                    <td className="px-(--space-1) py-(--space-2) text-center">
                      <Link
                        href={`/admin/students/${s.id}`}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-(--radius-sm) border border-line text-ink-muted hover:bg-surface-sunken hover:text-ink transition-colors"
                        title="عرض الملف"
                      >
                        <Eye size={16} />
                      </Link>
                    </td>
                    <td className="px-(--space-1) py-(--space-2) text-center">
                      <button
                        onClick={() => setDeleteTarget(s)}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-(--radius-sm) border border-line text-danger hover:bg-danger-soft transition-colors"
                        title="حذف"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ---------- الجوال: بطاقة أطول ومريحة ---------- */}
      <motion.div
        initial="hidden"
        animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.02 } } }}
        className="md:hidden space-y-(--space-2) mt-(--space-2)"
      >
        {rows.map((s) => {
          const message = fillTemplate(template, {
            name: s.fullName,
            barcode: s.code,
            program: programInfo.program_name,
            mosque: programInfo.mosque_name,
          });
          const isSelected = selected.has(s.id);
          const waLink = buildWaMeLink(s.guardianPhone, message);

          return (
            <motion.div
              key={s.id}
              variants={{ hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0 } }}
              transition={{ duration: 0.16, ease: [0.2, 0, 0, 1] }}
            >
              <Card
                className="md:hidden !p-(--space-4)"
                onClick={selectMode ? () => toggle(s.id) : undefined}
              >
                <div className="flex items-start justify-between mb-(--space-2)">
                  <div className="flex items-center gap-(--space-2) min-w-0">
                    {selectMode && (
                      <span className="text-brand shrink-0">
                        {isSelected ? <CheckSquare size={20} /> : <Square size={20} className="text-ink-faint" />}
                      </span>
                    )}
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-soft text-brand-hover font-bold text-base shrink-0">
                      {s.fullName.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] text-ink-faint font-mono">#{s.code}</p>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-[15px] font-bold text-ink truncate">{s.fullName}</p>
                        <BadgeStrip badges={s.badges} max={2} />
                      </div>
                    </div>
                  </div>
                  <span className="flex items-center gap-1 text-base font-bold text-brand shrink-0">
                    <Trophy size={15} /> {s.points}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap mb-(--space-3)">
                  <ColorTag label={s.circleName ?? "بلا حلقة"} token={s.circleColor} />
                  {s.groupName && <ColorTag label={s.groupName} token={s.groupColor} />}
                  {s.status === "dropped_out" && (
                    <Badge tone="danger">
                      <UserX size={11} /> منقطع
                    </Badge>
                  )}
                  {s.hasUnreadNote && (
                    <Badge tone="warning">
                      <MessageSquare size={11} /> رسالة جديدة
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-(--space-4) mb-(--space-3) text-[13px] font-semibold">
                  <span className="flex items-center gap-1" style={{ color: "var(--color-success)" }}>
                    <CalendarCheck size={14} /> {s.presentCount} حضور
                  </span>
                  <span className="flex items-center gap-1" style={{ color: "var(--color-danger)" }}>
                    <CalendarX size={14} /> {s.absentCount} غياب
                  </span>
                </div>

                {!selectMode && (
                  <div className="flex items-center gap-(--space-2) pt-(--space-3) border-t border-line">
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 h-10 flex items-center justify-center gap-1.5 rounded-(--radius-sm) border border-line text-brand text-[13px] font-bold hover:bg-brand-soft transition-colors"
                    >
                      <MessageCircle size={15} /> تواصل
                    </a>
                    <Link
                      href={`/admin/students/${s.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 h-10 flex items-center justify-center gap-1.5 rounded-(--radius-sm) border border-line text-ink-muted text-[13px] font-bold hover:bg-surface-sunken transition-colors"
                    >
                      <Eye size={15} /> الملف
                    </Link>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget(s);
                      }}
                      className="h-10 w-10 flex items-center justify-center rounded-(--radius-sm) border border-line text-danger hover:bg-danger-soft transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                )}
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      </div>

      <AnimatePresence>
        {selectMode && selected.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}
            className="fixed bottom-20 md:bottom-6 inset-x-4 z-40 max-w-[600px] mx-auto rounded-(--radius-md) border-bold border-line-strong bg-surface-raised shadow-brutal px-(--space-4) py-(--space-3) flex items-center justify-between gap-(--space-3)"
          >
            <p className="text-sm font-bold text-ink">{selected.size} محدد</p>
            <div className="flex items-center gap-(--space-2)">
              <Button size="sm" variant="danger" onClick={() => setBulkDropoutOpen(true)}>
                <UserX size={14} /> منقطع
              </Button>
              <Button size="sm" variant="outline" onClick={() => setBulkDeleteOpen(true)}>
                <Trash2 size={14} /> حذف
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {bulkDropoutOpen && (
        <BulkDropoutModal
          count={selected.size}
          onCancel={() => setBulkDropoutOpen(false)}
          onConfirm={async (reason) => {
            await bulkDropoutAction(Array.from(selected), reason);
            setBulkDropoutOpen(false);
            exitSelectMode();
          }}
        />
      )}
      {bulkDeleteOpen && (
        <BulkDeleteModal
          count={selected.size}
          onCancel={() => setBulkDeleteOpen(false)}
          onConfirm={async () => {
            await bulkDeleteStudentsAction(Array.from(selected));
            setBulkDeleteOpen(false);
            exitSelectMode();
          }}
        />
      )}
      {deleteTarget && (
        <ConfirmDeleteModal
          title="حذف الطالب"
          message={`سيتم حذف "${deleteTarget.fullName}" وكل بياناته نهائياً — لا يمكن التراجع عن هذا الإجراء.`}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={async () => {
            await deleteStudentAction(deleteTarget.id);
            setDeleteTarget(null);
          }}
        />
      )}
    </main>
  );
}

function ConfirmDeleteModal({
  title,
  message,
  onCancel,
  onConfirm,
}: {
  title: string;
  message: string;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
}) {
  const [pending, setPending] = useState(false);
  return (
    <Modal title={title} onClose={onCancel}>
      <div className="space-y-(--space-4)">
        <div className="rounded-(--radius-sm) bg-danger-soft border border-danger px-(--space-3) py-(--space-3) text-[13px] font-semibold text-danger">
          {message}
        </div>
        <div className="flex justify-end gap-(--space-2)">
          <Button type="button" variant="ghost" onClick={onCancel}>
            إلغاء
          </Button>
          <Button
            type="button"
            variant="danger"
            disabled={pending}
            onClick={async () => {
              setPending(true);
              await onConfirm();
            }}
          >
            {pending ? "جارِ الحذف..." : "تأكيد الحذف"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function BulkDropoutModal({
  count,
  onCancel,
  onConfirm,
}: {
  count: number;
  onCancel: () => void;
  onConfirm: (reason: string) => Promise<void>;
}) {
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);
  return (
    <Modal title={`تسجيل ${count} طالب كمنقطعين`} onClose={onCancel}>
      <div className="space-y-(--space-4)">
        <div className="rounded-(--radius-sm) bg-danger-soft border border-danger px-(--space-3) py-(--space-3) text-[13px] font-semibold text-danger">
          سيتم إخراج الطلاب المحددين ({count}) من القوائم النشطة.
        </div>
        <div>
          <Label htmlFor="bulk_reason">السبب (اختياري)</Label>
          <Textarea id="bulk_reason" value={reason} onChange={(e) => setReason(e.target.value)} rows={2} />
        </div>
        <div className="flex justify-end gap-(--space-2)">
          <Button type="button" variant="ghost" onClick={onCancel}>
            إلغاء
          </Button>
          <Button
            type="button"
            variant="danger"
            disabled={pending}
            onClick={async () => {
              setPending(true);
              await onConfirm(reason);
            }}
          >
            {pending ? "جارِ التنفيذ..." : "تأكيد"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function BulkDeleteModal({ count, onCancel, onConfirm }: { count: number; onCancel: () => void; onConfirm: () => Promise<void> }) {
  const [confirmed, setConfirmed] = useState(false);
  const [pending, setPending] = useState(false);
  return (
    <Modal title={`حذف ${count} طالب نهائياً`} onClose={onCancel}>
      <div className="space-y-(--space-4)">
        <div className="rounded-(--radius-sm) bg-danger-soft border border-danger px-(--space-3) py-(--space-3) text-[13px] font-semibold text-danger">
          سيتم حذف جميع بيانات الطلاب المحددين ({count}) نهائياً — لا يمكن التراجع عن هذا الإجراء.
        </div>
        <label className="flex items-center gap-(--space-2) text-sm font-semibold text-ink">
          <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="h-5 w-5" />
          أفهم أن هذا الإجراء نهائي ولا يمكن التراجع عنه
        </label>
        <div className="flex justify-end gap-(--space-2)">
          <Button type="button" variant="ghost" onClick={onCancel}>
            إلغاء
          </Button>
          <Button
            type="button"
            variant="danger"
            disabled={!confirmed || pending}
            onClick={async () => {
              setPending(true);
              await onConfirm();
            }}
          >
            {pending ? "جارِ الحذف..." : "حذف نهائياً"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
