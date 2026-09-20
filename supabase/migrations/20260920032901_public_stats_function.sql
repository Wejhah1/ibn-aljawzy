-- دالة آمنة تُرجع إحصاءات مجمّعة فقط (بلا بيانات شخصية) للواجهة العامة — يمكن لـ anon استدعاءها
create or replace function public.public_stats()
returns json
language sql
stable
security definer
set search_path = public
as $$
  select json_build_object(
    'season_name', (select name from public.seasons where status = 'current' limit 1),
    'season_start', (select start_date from public.seasons where status = 'current' limit 1),
    'season_end', (select end_date from public.seasons where status = 'current' limit 1),
    'total_active_students', (select count(*) from public.students where status = 'active'),
    'total_circles', (select count(*) from public.circles where is_active = true)
  );
$$;

grant execute on function public.public_stats() to anon;
