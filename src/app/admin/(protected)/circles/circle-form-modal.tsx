"use client";

import { useActionState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ColorTokenPicker } from "@/components/ui/color-token-picker";
import { createCircleAction, updateCircleAction, type FormState } from "./actions";

interface Circle {
  id: string;
  name: string;
  leader_name: string | null;
  leader_phone: string | null;
  teacher_name?: string | null;
  teacher_phone?: string | null;
  color_token?: string;
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
        <ColorTokenPicker name="color_token" defaultValue={circle?.color_token} />
        <div className="grid grid-cols-2 gap-(--space-3)">
          <div>
            <Label htmlFor="teacher_name">اسم المعلم</Label>
            <Input id="teacher_name" name="teacher_name" defaultValue={circle?.teacher_name ?? ""} />
          </div>
          <div>
            <Label htmlFor="teacher_phone">جوال المعلم</Label>
            <Input id="teacher_phone" name="teacher_phone" defaultValue={circle?.teacher_phone ?? ""} dir="ltr" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-(--space-3)">
          <div>
            <Label htmlFor="leader_name">اسم قائد الحلقة</Label>
            <Input id="leader_name" name="leader_name" defaultValue={circle?.leader_name ?? ""} />
          </div>
          <div>
            <Label htmlFor="leader_phone">جوال القائد</Label>
            <Input id="leader_phone" name="leader_phone" defaultValue={circle?.leader_phone ?? ""} dir="ltr" />
          </div>
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
