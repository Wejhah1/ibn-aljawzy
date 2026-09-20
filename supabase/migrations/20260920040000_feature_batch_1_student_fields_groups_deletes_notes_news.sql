-- ============================================================
-- 1) حقول جديدة على الطلاب: رقم شخصي، نوع الهوية، الجنسية
-- ============================================================
do $$ begin
  create type public.id_document_type as enum ('national_id', 'iqama', 'passport');
exception when duplicate_object then null; end $$;

alter table public.students
  add column if not exists personal_number text,
  add column if not exists id_type public.id_document_type not null default 'national_id',
  add column if not exists nationality text;

-- ============================================================
-- 2) فصل الحلقات عن المجموعات: مجموعة لم تعد مرتبطة إلزامياً بحلقة واحدة
-- ============================================================
alter table public.groups alter column circle_id drop not null;

-- ============================================================
-- 3) حذف موسم نهائياً (وليس أرشفة فقط) — للمدراء فقط
-- ============================================================
create or replace function public.delete_season_permanently(p_season_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'unauthorized';
  end if;

  delete from public.point_transactions where season_id = p_season_id;
  delete from public.attendance_records where season_id = p_season_id;
  delete from public.attendance_auto_points_settings where season_id = p_season_id;
  delete from public.student_achievements where season_id = p_season_id;
  delete from public.student_badges where season_id = p_season_id;
  delete from public.monthly_results where season_id = p_season_id;
  update public.student_flags set season_id = null where season_id = p_season_id;
  update public.dropout_periods set season_id = null where season_id = p_season_id;
  delete from public.student_season_enrollments where season_id = p_season_id;
  delete from public.program_days where season_id = p_season_id;
  update public.groups set circle_id = null where circle_id in (select id from public.circles where season_id = p_season_id);
  delete from public.circles where season_id = p_season_id;
  delete from public.seasons where id = p_season_id;
end;
$$;

revoke all on function public.delete_season_permanently(uuid) from public, anon, authenticated;
grant execute on function public.delete_season_permanently(uuid) to authenticated;

-- ============================================================
-- 4) حذف طالب نهائياً — للمدراء فقط
-- ============================================================
create or replace function public.delete_student_permanently(p_student_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'unauthorized';
  end if;

  delete from public.point_transactions where student_id = p_student_id;
  delete from public.attendance_records where student_id = p_student_id;
  delete from public.student_achievements where student_id = p_student_id;
  delete from public.student_badges where student_id = p_student_id;
  delete from public.student_flags where student_id = p_student_id;
  delete from public.dropout_periods where student_id = p_student_id;
  delete from public.monthly_results where student_id = p_student_id;
  delete from public.student_season_enrollments where student_id = p_student_id;
  delete from public.parent_notes where student_id = p_student_id;
  delete from public.students where id = p_student_id;
end;
$$;

-- ============================================================
-- 5) ملاحظات ولي الأمر <-> الإدارة
-- ============================================================
create table if not exists public.parent_notes (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  sender text not null check (sender in ('parent', 'admin')),
  sender_profile_id uuid references public.profiles(id),
  message text not null,
  is_read_by_admin boolean not null default false,
  is_read_by_parent boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists parent_notes_student_idx on public.parent_notes (student_id, created_at);

alter table public.parent_notes enable row level security;

create policy "staff manage parent notes" on public.parent_notes for all
  using (public.is_staff())
  with check (public.is_staff());

-- منح تنفيذ حذف الطالب بعد إنشاء الجدول الذي يشير إليه
revoke all on function public.delete_student_permanently(uuid) from public, anon, authenticated;
grant execute on function public.delete_student_permanently(uuid) to authenticated;

-- ============================================================
-- 6) الأخبار والصور للصفحة الرئيسية
-- ============================================================
create table if not exists public.news_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text,
  image_url text,
  is_published boolean not null default true,
  published_at timestamptz not null default now(),
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create index if not exists news_posts_published_idx on public.news_posts (is_published, published_at desc);

alter table public.news_posts enable row level security;

create policy "staff manage news" on public.news_posts for all
  using (public.is_staff())
  with check (public.is_staff());

create policy "public read published news" on public.news_posts for select
  to anon
  using (is_published = true);
