"use client";

import { useActionState, useState } from "react";
import { createStudentAction, type FormState } from "../actions";
import { Card } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Group {
  id: string;
  name: string;
}
interface Circle {
  id: string;
  name: string;
  groups: Group[];
}

export function NewStudentForm({
  currentSeason,
  circles,
}: {
  currentSeason: { id: string; name: string } | null;
  circles: Circle[];
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(createStudentAction, null);
  const [circleId, setCircleId] = useState("");
  const groups = circles.find((c) => c.id === circleId)?.groups ?? [];

  return (
    <Card>
      <form action={formAction} className="space-y-(--space-4)">
        <div>
          <Label htmlFor="full_name">الاسم الكامل</Label>
          <Input id="full_name" name="full_name" required autoFocus />
        </div>
        <div className="grid sm:grid-cols-2 gap-(--space-3)">
          <div>
            <Label htmlFor="birth_date">تاريخ الميلاد</Label>
            <Input id="birth_date" name="birth_date" type="date" />
          </div>
          <div>
            <Label htmlFor="national_id">رقم الهوية</Label>
            <Input id="national_id" name="national_id" />
          </div>
        </div>

        <div className="pt-(--space-2) border-t border-line">
          <p className="text-[13px] font-bold text-ink mt-(--space-4) mb-(--space-3)">بيانات ولي الأمر</p>
          <div className="grid sm:grid-cols-2 gap-(--space-3)">
            <div>
              <Label htmlFor="guardian_name">اسم ولي الأمر</Label>
              <Input id="guardian_name" name="guardian_name" />
            </div>
            <div>
              <Label htmlFor="guardian_relation">صلة القرابة</Label>
              <Input id="guardian_relation" name="guardian_relation" placeholder="الأب، الأم، ..." />
            </div>
          </div>
          <div className="mt-(--space-3)">
            <Label htmlFor="guardian_phone">جوال ولي الأمر (لدخول بوابة ولي الأمر)</Label>
            <Input id="guardian_phone" name="guardian_phone" required dir="ltr" placeholder="05xxxxxxxx" />
          </div>
        </div>

        {currentSeason && (
          <div className="pt-(--space-2) border-t border-line">
            <p className="text-[13px] font-bold text-ink mt-(--space-4) mb-(--space-3)">التسجيل في {currentSeason.name}</p>
            <input type="hidden" name="season_id" value={currentSeason.id} />
            <div className="grid sm:grid-cols-2 gap-(--space-3)">
              <div>
                <Label htmlFor="circle_id">الحلقة</Label>
                <select
                  id="circle_id"
                  name="circle_id"
                  value={circleId}
                  onChange={(e) => setCircleId(e.target.value)}
                  className="h-11 w-full rounded-(--radius-sm) border border-line bg-surface-raised px-(--space-3) text-sm text-ink"
                >
                  <option value="">بدون حلقة</option>
                  {circles.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="group_id">المجموعة</Label>
                <select
                  id="group_id"
                  name="group_id"
                  disabled={!circleId}
                  className="h-11 w-full rounded-(--radius-sm) border border-line bg-surface-raised px-(--space-3) text-sm text-ink disabled:opacity-(--opacity-disabled)"
                >
                  <option value="">بدون مجموعة</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        <div className="pt-(--space-2) border-t border-line">
          <div className="mt-(--space-4)">
            <Label htmlFor="address">العنوان</Label>
            <Input id="address" name="address" />
          </div>
          <div className="mt-(--space-3)">
            <Label htmlFor="notes">ملاحظات</Label>
            <Textarea id="notes" name="notes" rows={3} />
          </div>
        </div>

        {state?.error && <p className="text-[13px] font-semibold text-danger">{state.error}</p>}

        <div className="flex justify-end pt-(--space-2)">
          <Button type="submit" disabled={pending}>
            {pending ? "جارِ الحفظ..." : "حفظ الطالب"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
