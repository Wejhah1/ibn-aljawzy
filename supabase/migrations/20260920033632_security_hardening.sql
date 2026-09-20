-- 1) إصلاح search_path الثابت لدالة set_updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 2) نقل امتداد pg_trgm خارج مخطط public (أفضل ممارسة أمنية)
create schema if not exists extensions;
alter extension pg_trgm set schema extensions;

-- 3) منع الاستدعاء المباشر لدوال مخصصة للمشغّلات (triggers) فقط
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.sync_enrollment_points() from public, anon, authenticated;
