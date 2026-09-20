import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getProgramInfo } from "@/lib/settings";
import { fillTemplate, buildWaMeLink, DEFAULT_WHATSAPP_TEMPLATES } from "@/lib/whatsapp";
import { Card, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, MessageCircle, UserX } from "lucide-react";

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; circle?: string }>;
}) {
  const { q = "", status = "active", circle = "" } = await searchParams;
  const supabase = await createClient();

  const { data: currentSeason } = await supabase
    .from("seasons")
    .select("id")
    .eq("status", "current")
    .maybeSingle();

  const { data: circles } = await supabase.from("circles").select("id, name").order("name");

  let query = supabase
    .from("students")
    .select(
      "id, code, full_name, guardian_name, guardian_phone, status, student_season_enrollments(season_id, circle_id, circles(name), groups(name))"
    )
    .order("full_name");

  if (status !== "all") query = query.eq("status", status as "active" | "dropped_out");
  if (q) query = query.or(`full_name.ilike.%${q}%,code.eq.${q},guardian_phone.ilike.%${q}%`);

  const { data: students } = await query;

  const filtered = (students ?? []).filter((s) => {
    if (!circle) return true;
    return s.student_season_enrollments.some(
      (e) => e.season_id === currentSeason?.id && e.circle_id === circle
    );
  });

  const programInfo = await getProgramInfo(supabase);
  const { data: templateRow } = await supabase
    .from("whatsapp_templates")
    .select("body")
    .eq("context", "students_list_contact")
    .maybeSingle();
  const template = templateRow?.body ?? DEFAULT_WHATSAPP_TEMPLATES.students_list_contact;

  return (
    <main className="p-(--space-4) md:p-(--space-8) max-w-[1100px] mx-auto">
      <div className="flex items-center justify-between mb-(--space-6) flex-wrap gap-(--space-3)">
        <div>
          <h1 className="text-[22px] leading-[30px] font-bold text-ink">الطلاب</h1>
          <p className="text-sm text-ink-muted mt-1">{filtered.length} طالب</p>
        </div>
        <Link href="/admin/students/new">
          <Button>
            <Plus size={16} /> طالب جديد
          </Button>
        </Link>
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
            {(circles ?? []).map((c) => (
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
        {filtered.length === 0 && (
          <Card>
            <CardDescription>لا يوجد طلاب مطابقون.</CardDescription>
          </Card>
        )}
        {filtered.map((s) => {
          const enrollment = s.student_season_enrollments.find((e) => e.season_id === currentSeason?.id);
          const circleName = Array.isArray(enrollment?.circles) ? enrollment?.circles[0]?.name : (enrollment?.circles as { name: string } | null)?.name;
          const groupName = Array.isArray(enrollment?.groups) ? enrollment?.groups[0]?.name : (enrollment?.groups as { name: string } | null)?.name;
          const message = fillTemplate(template, {
            name: s.full_name,
            barcode: s.code,
            program: programInfo.program_name,
            mosque: programInfo.mosque_name,
          });
          return (
            <Card key={s.id} className="flex items-center justify-between gap-(--space-3) flex-wrap">
              <Link href={`/admin/students/${s.id}`} className="flex items-center gap-(--space-3) flex-1 min-w-[220px]">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-soft text-brand-hover font-bold text-sm shrink-0">
                  {s.full_name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-(--space-2)">
                    <p className="text-sm font-semibold text-ink truncate">{s.full_name}</p>
                    <Badge tone="neutral">#{s.code}</Badge>
                    {s.status === "dropped_out" && (
                      <Badge tone="danger">
                        <UserX size={11} /> منقطع
                      </Badge>
                    )}
                  </div>
                  <p className="text-[12px] text-ink-muted truncate">
                    {circleName ?? "بلا حلقة"}
                    {groupName ? ` · ${groupName}` : ""} · ولي الأمر: {s.guardian_name ?? "—"}
                  </p>
                </div>
              </Link>
              <a
                href={buildWaMeLink(s.guardian_phone, message)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-11 w-11 items-center justify-center rounded-(--radius-sm) border-bold border-line-strong text-brand hover:bg-brand-soft shrink-0"
                title="تواصل عبر واتساب"
              >
                <MessageCircle size={18} />
              </a>
            </Card>
          );
        })}
      </div>
    </main>
  );
}
