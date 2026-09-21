-- ============================================================
-- نظام إشعارات Web Push
-- ملاحظة معمارية مهمة: أولياء الأمور في هذا النظام ليس لديهم حساب
-- Supabase Auth إطلاقاً — هويتهم هي guardian_phone على جدول students،
-- وجلستهم كوكي HMAC مخصص (راجع src/lib/parent-session.ts). فريق الإدارة
-- فقط لديه حساب auth.users مرتبط بجدول profiles. لذلك الاشتراك هنا مصمم
-- بملكية ثنائية: إمّا guardian_phone (لولي الأمر) أو staff_id (للإداري)،
-- تماماً كما تتعامل بقية الشيفرة مع هذا الفرق (انظر src/app/portal/actions.ts).
-- ============================================================

create table if not exists public.push_subscriptions (
  id bigserial primary key,
  guardian_phone text,
  staff_id uuid references public.profiles(id) on delete cascade,
  endpoint text not null unique,
  auth_key text not null,
  p256dh_key text not null,
  created_at timestamptz not null default now(),
  last_used_at timestamptz not null default now(),
  user_agent text,

  constraint push_subscriptions_owner_check check (
    (guardian_phone is not null and staff_id is null)
    or (guardian_phone is null and staff_id is not null)
  )
);

create table if not exists public.notification_log (
  id bigserial primary key,
  guardian_phone text,
  staff_id uuid references public.profiles(id) on delete set null,
  notification_type text not null, -- 'attendance' | 'badge' | 'achievement' | 'result' | 'points' | 'news'
  student_id uuid references public.students(id) on delete set null,
  title text not null,
  body text not null,
  data jsonb,
  sent_at timestamptz not null default now(),
  status text not null default 'sent' -- 'sent' | 'failed' | 'bounced'
);

-- RLS: لا اعتماد على auth.uid() لولي الأمر لأنه غير موجود أصلاً في auth.users.
-- كل الوصول من جهة ولي الأمر يمر عبر service role (createAdminClient) والتحقق
-- من الملكية يتم برمجياً في actions.ts، تماماً كبقية الجداول المرتبطة بأولياء
-- الأمور في هذا المشروع. جهة الإداري تُتحقق عبر auth.uid() = staff_id.
alter table public.push_subscriptions enable row level security;
alter table public.notification_log enable row level security;

create policy "staff_can_manage_own_subscription"
  on public.push_subscriptions
  for all
  using (auth.uid() = staff_id)
  with check (auth.uid() = staff_id);

create policy "staff_can_read_notification_logs"
  on public.notification_log
  for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_active = true
    )
  );

create index if not exists idx_push_subscriptions_guardian_phone
  on public.push_subscriptions(guardian_phone);
create index if not exists idx_push_subscriptions_staff_id
  on public.push_subscriptions(staff_id);
create index if not exists idx_notification_log_guardian_phone
  on public.notification_log(guardian_phone);
create index if not exists idx_notification_log_student_id
  on public.notification_log(student_id);
create index if not exists idx_notification_log_type
  on public.notification_log(notification_type);

create or replace function public.cleanup_old_subscriptions()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.push_subscriptions
  where last_used_at < now() - interval '30 days';
$$;

grant execute on function public.cleanup_old_subscriptions() to service_role;
