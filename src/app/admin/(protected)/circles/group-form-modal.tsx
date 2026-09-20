"use client";

import { useActionState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createGroupAction, updateGroupAction, type FormState } from "./actions";

interface Group {
  id: string;
  name: string;
  leader_name: string | null;
  leader_phone: string | null;
}

const GROUP_COLOR_OPTIONS = [1, 2, 3, 4, 5, 6];

export function GroupFormModal({
  group,
  existingCount = 0,
  onClose,
}: {
  group?: Group;
  existingCount?: number;
  onClose: () => void;
}) {
  const isEdit = !!group;
  const action = isEdit ? updateGroupAction : createGroupAction;
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, null);
  const defaultColor = `group-${(existingCount % GROUP_COLOR_OPTIONS.length) + 1}`;

  useEffect(() => {
    if (state?.success) onClose();
  }, [state, onClose]);

  return (
    <Modal title={isEdit ? "تعديل المجموعة" : "مجموعة جديدة"} onClose={onClose}>
      <form action={formAction} className="space-y-(--space-4)">
        {isEdit && <input type="hidden" name="id" value={group!.id} />}
        {!isEdit && <input type="hidden" name="color_token" value={defaultColor} />}
        <div>
          <Label htmlFor="name">اسم المجموعة</Label>
          <Input id="name" name="name" required defaultValue={group?.name} placeholder="مثال: المجموعة الأولى" />
        </div>
        <div>
          <Label htmlFor="leader_name">اسم قائد المجموعة</Label>
          <Input id="leader_name" name="leader_name" defaultValue={group?.leader_name ?? ""} />
        </div>
        <div>
          <Label htmlFor="leader_phone">جوال قائد المجموعة</Label>
          <Input id="leader_phone" name="leader_phone" defaultValue={group?.leader_phone ?? ""} dir="ltr" />
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
