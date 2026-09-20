-- ============================================================
-- RLS: القاعدة العامة — anon لا يصل لبيانات الطلاب أبداً.
-- فريق الإدارة (profiles نشط) يصل حسب صلاحيته. service role يتجاوز RLS دائماً (لبوابة ولي الأمر وواتساب).
-- ============================================================

alter table public.profiles enable row level security;
alter table public.seasons enable row level security;
alter table public.program_days enable row level security;
alter table public.circles enable row level security;
alter table public.groups enable row level security;
alter table public.students enable row level security;
alter table public.student_season_enrollments enable row level security;
alter table public.dropout_periods enable row level security;
alter table public.attendance_records enable row level security;
alter table public.point_transactions enable row level security;
alter table public.achievements enable row level security;
alter table public.student_achievements enable row level security;
alter table public.badges enable row level security;
alter table public.student_badges enable row level security;
alter table public.flags enable row level security;
alter table public.student_flags enable row level security;
alter table public.monthly_results enable row level security;
alter table public.attendance_auto_points_settings enable row level security;
alter table public.whatsapp_templates enable row level security;
alter table public.app_settings enable row level security;
alter table public.audit_log enable row level security;

-- دالة مساعدة: هل المستخدم الحالي عضو نشط في فريق الإدارة؟
create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and is_active = true
  );
$$;

-- دالة مساعدة: هل المستخدم الحالي مدير (admin)؟
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and is_active = true and role = 'admin'
  );
$$;

-- ---------- profiles ----------
create policy "staff read profiles" on public.profiles for select
  using (public.is_staff());
create policy "admin manage profiles" on public.profiles for all
  using (public.is_admin()) with check (public.is_admin());
create policy "self read own profile" on public.profiles for select
  using (id = auth.uid());

-- ---------- الجداول العامة لفريق الإدارة (قراءة وكتابة لأي عضو نشط) ----------
do $$
declare t text;
begin
  foreach t in array array[
    'seasons','program_days','circles','groups','students',
    'student_season_enrollments','dropout_periods','attendance_records',
    'point_transactions','achievements','student_achievements','badges',
    'student_badges','flags','student_flags','monthly_results',
    'attendance_auto_points_settings','whatsapp_templates','app_settings'
  ]
  loop
    execute format(
      'create policy "staff full access" on public.%I for all using (public.is_staff()) with check (public.is_staff())',
      t
    );
  end loop;
end $$;

-- ---------- audit_log: يُكتب من الخادم، قراءة لفريق الإدارة فقط، لا تعديل ولا حذف ----------
create policy "staff read audit_log" on public.audit_log for select
  using (public.is_staff());
create policy "staff insert audit_log" on public.audit_log for insert
  with check (public.is_staff());

-- ============================================================
-- أول مستخدم يسجّل يأخذ صلاحية admin تلقائياً، وما بعده data_entry
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  is_first boolean;
begin
  select not exists (select 1 from public.profiles) into is_first;

  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    case when is_first then 'admin'::user_role else 'data_entry'::user_role end
  );

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
