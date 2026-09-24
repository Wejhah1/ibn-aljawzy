import { createClient } from "@/lib/supabase/server";
import { Card, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Search } from "lucide-react";

const STATUS_LABEL: Record<string, { label: string; tone: "success" | "danger" | "warning" | "info" }> = {
  present: { label: "حاضر", tone: "success" },
  absent: { label: "غائب", tone: "danger" },
  late: { label: "متأخر", tone: "warning" },
  excused: { label: "بعذر", tone: "info" },
};

export default async function AbsenceSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; id?: string }>;
}) {
  const { q = "", id = "" } = await searchParams;
  const supabase = await createClient();

  let student: { id: string; full_name: string; code: string } | null = null;
  let records: { day_date: string; status: string; season_name: string }[] = [];

  let candidates: { id: string; full_name: string; code: string }[] = [];

  if (id) {
    const { data } = await supabase.from("students").select("id, full_name, code").eq("id", id).maybeSingle();
    student = data ?? null;
  } else if (q.trim()) {
    const safe = q.trim().replace(/[%,()*\\]/g, " ").trim();
    const { data: students } = await supabase
      .from("students")
      .select("id, full_name, code")
      .or(`full_name.ilike.%${safe}%,code.eq.${safe}`)
      .order("code")
      .limit(30);
    const found = students ?? [];
    const exactCode = found.find((s) => s.code === safe);
    if (exactCode) student = exactCode;
    else if (found.length === 1) student = found[0];
    else candidates = found;
  }

  if (student) {
    {
      const { data } = await supabase
        .from("attendance_records")
        .select("status, program_days(day_date), seasons(name)")
        .eq("student_id", student.id)
        .order("recorded_at", { ascending: false })
        .limit(200);

      records = (data ?? []).map((r) => {
        const pd = Array.isArray(r.program_days) ? r.program_days[0] : r.program_days;
        const s = Array.isArray(r.seasons) ? r.seasons[0] : r.seasons;
        return { day_date: pd?.day_date ?? "", status: r.status, season_name: s?.name ?? "" };
      });
    }
  }

  return (
    <main className="p-(--space-4) md:p-(--space-8) max-w-[700px] mx-auto">
      <h1 className="text-[22px] leading-[30px] font-bold text-ink mb-(--space-6)">بحث الغياب</h1>

      <form method="get" className="mb-(--space-6)">
        <Card className="flex gap-(--space-3)">
          <div className="relative flex-1">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint" />
            <Input name="q" defaultValue={q} placeholder="اسم الطالب أو الكود" className="pr-9" autoFocus />
          </div>
          <Button type="submit">بحث</Button>
        </Card>
      </form>

      {candidates.length > 1 && (
        <div className="space-y-(--space-2) mb-(--space-4)">
          <CardDescription>وُجد {candidates.length} طالب مطابق، اختر الطالب:</CardDescription>
          {candidates.map((c) => (
            <Link key={c.id} href={`/admin/absence-search?q=${encodeURIComponent(q)}&id=${c.id}`}>
              <Card className="flex items-center justify-between py-(--space-3) hover:bg-surface-sunken transition-colors">
                <p className="font-bold text-ink">{c.full_name}</p>
                <Badge tone="neutral">#{c.code}</Badge>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {(q.trim() || id) && !student && candidates.length === 0 && (
        <Card>
          <CardDescription>لم يُعثر على طالب مطابق.</CardDescription>
        </Card>
      )}

      {student && (
        <>
          <Card className="mb-(--space-4) flex items-center justify-between">
            <div>
              <p className="font-bold text-ink">{student.full_name}</p>
              <Badge tone="neutral">#{student.code}</Badge>
            </div>
            <Link href={`/admin/students/${student.id}`} className="text-[13px] font-semibold text-brand">
              عرض الملف الكامل
            </Link>
          </Card>

          <div className="space-y-(--space-2)">
            {records.length === 0 && (
              <Card>
                <CardDescription>لا يوجد سجل حضور لهذا الطالب بعد.</CardDescription>
              </Card>
            )}
            {records.map((r, i) => {
              const meta = STATUS_LABEL[r.status] ?? { label: r.status, tone: "info" as const };
              return (
                <Card key={i} className="flex items-center justify-between py-(--space-3)">
                  <div>
                    <p className="text-sm font-semibold text-ink">
                      {new Date(r.day_date).toLocaleDateString("ar-SA", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                    </p>
                    <p className="text-[12px] text-ink-muted">{r.season_name}</p>
                  </div>
                  <Badge tone={meta.tone}>{meta.label}</Badge>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </main>
  );
}
