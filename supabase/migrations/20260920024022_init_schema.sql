-- ============================================================
-- نظام إدارة برنامج حلقات ابن الجوزي الصيفي — مخطط قاعدة البيانات الأساسي
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- أنواع مُعدّدة ----------
create type user_role as enum ('admin', 'supervisor', 'data_entry');
create type season_status as enum ('current', 'archived');
create type student_status as enum ('active', 'dropped_out');
create type enrollment_status as enum ('active', 'dropped_out', 'transferred');
create type attendance_status as enum ('present', 'absent', 'late', 'excused');
create type point_source as enum ('manual', 'auto_attendance', 'achievement', 'adjustment');
create type flag_severity as enum ('info', 'warning', 'critical');
create type whatsapp_context as enum (
  'attendance_absent',
  'attendance_late',
  'students_list_contact',
  'quick_ops_contact'
);

-- ---------- profiles: مستخدمو فريق الإدارة ----------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role user_role not null default 'data_entry',
  phone text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- seasons: المواسم ----------
create table public.seasons (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  start_date date not null,
  end_date date not null,
  status season_status not null default 'archived',
  carry_over_points boolean not null default false,
  weekly_off_days smallint[] not null default '{}', -- 0=أحد .. 6=سبت
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint season_dates_valid check (end_date > start_date)
);

-- موسم واحد "حالي" فقط
create unique index one_current_season on public.seasons ((status = 'current'::season_status))
  where status = 'current';

-- ---------- program_days: أيام البرنامج الفعلية داخل الموسم ----------
create table public.program_days (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons(id) on delete cascade,
  day_date date not null,
  is_holiday boolean not null default false,
  note text,
  created_at timestamptz not null default now(),
  unique (season_id, day_date)
);

-- ---------- circles: الحلقات ----------
create table public.circles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  leader_name text,
  leader_phone text,
  season_id uuid references public.seasons(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- groups: المجموعات داخل الحلقة ----------
create table public.groups (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.circles(id) on delete cascade,
  name text not null,
  leader_name text,
  leader_phone text,
  color_token text not null default 'group-1',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- students: سجل الطالب الدائم ----------
create table public.students (
  id uuid primary key default gen_random_uuid(),
  code char(3) not null unique,
  full_name text not null,
  birth_date date,
  national_id text,
  guardian_name text,
  guardian_phone text not null,
  guardian_relation text,
  address text,
  photo_url text,
  status student_status not null default 'active',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint students_code_format check (code ~ '^[0-9]{3}$')
);

create extension if not exists pg_trgm;
create index students_guardian_phone_idx on public.students (guardian_phone);
create index students_full_name_idx on public.students using gin (full_name gin_trgm_ops);

-- ---------- student_season_enrollments: ربط الطالب بموسم معيّن ----------
create table public.student_season_enrollments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  season_id uuid not null references public.seasons(id) on delete cascade,
  circle_id uuid references public.circles(id) on delete set null,
  group_id uuid references public.groups(id) on delete set null,
  status enrollment_status not null default 'active',
  total_points int not null default 0,
  enrolled_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, season_id)
);

create index enrollments_season_idx on public.student_season_enrollments (season_id);
create index enrollments_circle_idx on public.student_season_enrollments (circle_id);
create index enrollments_group_idx on public.student_season_enrollments (group_id);

-- ---------- dropout_periods: سجل فترات انقطاع الطالب ----------
create table public.dropout_periods (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  season_id uuid references public.seasons(id) on delete set null,
  dropped_at timestamptz not null default now(),
  returned_at timestamptz,
  reason text,
  recorded_by uuid references public.profiles(id) on delete set null
);

-- ---------- attendance_records: سجلات الحضور ----------
create table public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  season_id uuid not null references public.seasons(id) on delete cascade,
  program_day_id uuid not null references public.program_days(id) on delete cascade,
  status attendance_status not null,
  recorded_by uuid references public.profiles(id) on delete set null,
  recorded_at timestamptz not null default now(),
  note text,
  unique (student_id, program_day_id)
);

create index attendance_program_day_idx on public.attendance_records (program_day_id);
create index attendance_student_idx on public.attendance_records (student_id);
create index attendance_season_idx on public.attendance_records (season_id);

-- ---------- point_transactions: حركات النقاط ----------
create table public.point_transactions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  season_id uuid not null references public.seasons(id) on delete cascade,
  points int not null,
  source point_source not null default 'manual',
  reason text,
  attendance_record_id uuid references public.attendance_records(id) on delete cascade,
  achievement_id uuid,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (attendance_record_id, source)
);

create index point_transactions_student_idx on public.point_transactions (student_id, season_id);

-- ---------- achievements: الإنجازات ----------
create table public.achievements (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  icon text,
  points_awarded int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.student_achievements (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  achievement_id uuid not null references public.achievements(id) on delete cascade,
  season_id uuid not null references public.seasons(id) on delete cascade,
  awarded_by uuid references public.profiles(id) on delete set null,
  awarded_at timestamptz not null default now(),
  note text
);

alter table public.point_transactions
  add constraint point_transactions_achievement_fk
  foreign key (achievement_id) references public.achievements(id) on delete set null;

-- ---------- badges: الأوسمة ----------
create table public.badges (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  icon text,
  color_token text not null default 'accent',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.student_badges (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  badge_id uuid not null references public.badges(id) on delete cascade,
  season_id uuid not null references public.seasons(id) on delete cascade,
  awarded_by uuid references public.profiles(id) on delete set null,
  awarded_at timestamptz not null default now(),
  note text
);

-- ---------- flags: العلامات ----------
create table public.flags (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  severity flag_severity not null default 'info',
  requires_action boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.student_flags (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  flag_id uuid not null references public.flags(id) on delete cascade,
  season_id uuid references public.seasons(id) on delete set null,
  is_resolved boolean not null default false,
  resolved_at timestamptz,
  resolved_by uuid references public.profiles(id) on delete set null,
  set_by uuid references public.profiles(id) on delete set null,
  set_at timestamptz not null default now(),
  note text
);

create index student_flags_unresolved_idx on public.student_flags (is_resolved) where is_resolved = false;

-- ---------- monthly_results: النتائج الشهرية ----------
create table public.monthly_results (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  season_id uuid not null references public.seasons(id) on delete cascade,
  period_label text not null,
  percentage numeric(5,2) not null check (percentage >= 0 and percentage <= 100),
  is_published boolean not null default false,
  uploaded_by uuid references public.profiles(id) on delete set null,
  uploaded_at timestamptz not null default now(),
  unique (student_id, season_id, period_label)
);

-- ---------- attendance_auto_points_settings: إعدادات النقاط التلقائية ----------
create table public.attendance_auto_points_settings (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons(id) on delete cascade unique,
  is_enabled boolean not null default false,
  points_present int not null default 0,
  points_late int not null default 0,
  points_excused int not null default 0,
  points_absent int not null default 0,
  updated_at timestamptz not null default now()
);

-- ---------- whatsapp_templates: قوالب واتساب ----------
create table public.whatsapp_templates (
  id uuid primary key default gen_random_uuid(),
  context whatsapp_context not null unique,
  label text not null,
  body text not null,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

-- ---------- app_settings: إعدادات عامة ----------
create table public.app_settings (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  key text not null,
  value jsonb not null default '{}'::jsonb,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now(),
  unique (category, key)
);

-- ---------- audit_log: سجل العمليات ----------
create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_log_entity_idx on public.audit_log (entity_type, entity_id);
create index audit_log_created_idx on public.audit_log (created_at desc);

-- ============================================================
-- دالة تحديث updated_at تلقائياً
-- ============================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array[
    'profiles','seasons','circles','groups','students',
    'student_season_enrollments','attendance_auto_points_settings',
    'whatsapp_templates','app_settings'
  ]
  loop
    execute format(
      'create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()',
      t
    );
  end loop;
end $$;
