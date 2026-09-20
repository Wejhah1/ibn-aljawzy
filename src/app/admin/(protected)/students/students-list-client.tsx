"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { buildWaMeLink, fillTemplate } from "@/lib/whatsapp";
import type { ProgramInfo } from "@/lib/settings";
import { bulkDropoutAction, bulkDeleteStudentsAction } from "./actions";
import { Search, Plus, MessageCircle, UserX, MessageSquare, CheckSquare, Square, Trash2 } from "lucide-react";

interface Row {
  id: string;
  code: string;
  fullName: string;
  guardianName: string | null;
  guardianPhone: string;
  status: string;
  circleName: string | null;
  groupName: string | null;
  hasUnreadNote: boolean;
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

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelected(new Set());
  };

  return (
    <main className="p-(--space-4) md:p-(--space-8) max-w-[1100px] mx-auto pb-24">
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

      <form method="get" className="mb-(--space-4)">
        <Card className="flex flex-col sm:flex-row gap-(--space-3)">
          <div className="relative flex-1">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint" />
            <Input name="q" defaultValue={q} placeholder="الاسم أو الكود أو جوال ولي الأمر" className="pr-9" />
          </div>
          <select
            name="status"
            defaultValue={status}
            className="h-11 rounded-(--radius-sm) border border-line bg-surface-raised px-(--space-3) text-sm font-medium text-ink"
          >
            <option value="active">نشط فقط</option>
            <option value="dropped_out">المنقطعون فقط</option>
            <option value="all">الكل</option>
          </select>
          <select
            name="circle"
            defaultValue={circle}
            className="h-11 rounded-(--radius-sm) border border-line bg-surface-raised px-(--space-3) text-sm font-medium text-ink"
          >
            <option value="">كل الحلقات</option>
            {circles.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <Button type="submit" variant="secondary">
            تصفية
          </Button>
        </Card>
      </form>

      <div className="space-y-(--space-2)">
        {rows.length === 0 && (
          <Card>
            <CardDescription>لا يوجد طلاب مطابقون.</CardDescription>
          </Card>
        )}
        {rows.map((s) => {
          const message = fillTemplate(template, {
            name: s.fullName,
            barcode: s.code,
            program: programInfo.program_name,
            mosque: programInfo.mosque_name,
          });
          const isSelected = selected.has(s.id);
          return (
            <Card key={s.id} className="flex items-center justify-between gap-(--space-3) flex-wrap">
              <div className="flex items-center gap-(--space-3) flex-1 min-w-[220px]">
                {selectMode && (
                  <button onClick={() => toggle(s.id)} className="shrink-0 text-brand">
                    {isSelected ? <CheckSquare size={20} /> : <Square size={20} className="text-ink-faint" />}
                  </button>
                )}
                <Link
                  href={selectMode ? "#" : `/admin/students/${s.id}`}
                  onClick={(e) => {
                    if (selectMode) {
                      e.preventDefault();
                      toggle(s.id);
                    }
                  }}
                  className="flex items-center gap-(--space-3) flex-1 min-w-0"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-soft text-brand-hover font-bold text-sm shrink-0">
                    {s.fullName.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-(--space-2)">
                      <p className="text-sm font-semibold text-ink truncate">{s.fullName}</p>
                      <Badge tone="neutral">#{s.code}</Badge>
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
                    <p className="text-[12px] text-ink-muted truncate">
                      {s.circleName ?? "بلا حلقة"}
                      {s.groupName ? ` · ${s.groupName}` : ""} · ولي الأمر: {s.guardianName ?? "—"}
                    </p>
                  </div>
                </Link>
              </div>
              {!selectMode && (
                <a
                  href={buildWaMeLink(s.guardianPhone, message)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-11 w-11 items-center justify-center rounded-(--radius-sm) border-bold border-line-strong text-brand hover:bg-brand-soft shrink-0"
                  title="تواصل عبر واتساب"
                >
                  <MessageCircle size={18} />
                </a>
              )}
            </Card>
          );
        })}
      </div>

      {selectMode && selected.size > 0 && (
        <div className="fixed bottom-20 md:bottom-6 inset-x-4 z-40 max-w-[600px] mx-auto rounded-(--radius-md) border-bold border-line-strong bg-surface-raised shadow-brutal px-(--space-4) py-(--space-3) flex items-center justify-between gap-(--space-3)">
          <p className="text-sm font-bold text-ink">{selected.size} محدد</p>
          <div className="flex items-center gap-(--space-2)">
            <Button size="sm" variant="danger" onClick={() => setBulkDropoutOpen(true)}>
              <UserX size={14} /> منقطع
            </Button>
            <Button size="sm" variant="outline" onClick={() => setBulkDeleteOpen(true)}>
              <Trash2 size={14} /> حذف
            </Button>
          </div>
        </div>
      )}

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
    </main>
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
