"use client";

import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

// بديل من تصميم الموقع لنافذة window.confirm الافتراضية في المتصفح
export function ConfirmDialog({
  title,
  message,
  confirmLabel = "تأكيد",
  cancelLabel = "إلغاء",
  tone = "danger",
  pending = false,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "primary";
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal title={title} onClose={onCancel} maxWidth="420px">
      <p className="text-sm leading-relaxed text-ink-muted mb-(--space-6)">{message}</p>
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-(--space-2)">
        <Button variant="outline" onClick={onCancel} disabled={pending}>
          {cancelLabel}
        </Button>
        <Button variant={tone} onClick={onConfirm} disabled={pending}>
          {pending ? "جارٍ التنفيذ..." : confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
