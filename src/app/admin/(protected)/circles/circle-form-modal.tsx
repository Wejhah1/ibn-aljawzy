"use client";

import { useActionState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createCircleAction, updateCircleAction, type FormState } from "./actions";

interface Circle {
  id: string;
  name: string;
  leader_name: string | null;
  leader_phone: string | null;
}

export function CircleFormModal({
  circle,
  seasonId,
  onClose,
}: {
  circle?: Circle;
  seasonId?: string | null;
  onClose: () => void;
}) {
  const isEdit = !!circle;
  const action = isEdit ? updateCircleAction : createCircleAction;
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, null);

  useEffect(() => {
    if (state?.success) onClose();
  }, [state, onClose]);

  return (
    <Modal title={isEdit ? "تعديل الحلقة" : "حلقة جديدة"} onClose={onClose}>
      <form action={formAction} className="space-y-(--space-4)">
        {isEdit && <input type="hidden" name="id" value={circle!.id} />}
        {!isEdit && <input type="hidden" name="season_id" value={seasonId ?? ""} />}
        <div>
          <Label htmlFor="name">اسم الحلقة</Label>
          <Input id="name" name="name" required defaultValue={circle?.name} placeholder="مثال: حلقة عبدالعزيز بن باز" />
        </div>
        <div>
          <Label htmlFor="leader_name">اسم القائد</Label>
          <Input id="leader_name" name="leader_name" defaultValue={circle?.leader_name ?? ""} />
        </div>
        <div>
          <Label htmlFor="leader_phone">جوال القائد</Label>
          <Input id="leader_phone" name="leader_phone" defaultValue={circle?.leader_phone ?? ""} dir="ltr" />
        </div>
        {state?.error && <p className="text-[13px] font-semibold text-danger">{state.error}</p>}
        <div className="flex justify-end gap-(--space-2) pt-(--space-2)">
          <Button type="button" variant="ghost" onClick={onClose}>
            إلغاء
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "جارِ الحفظ..." : "حفظ"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
