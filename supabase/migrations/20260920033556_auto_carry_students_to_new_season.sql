-- تحديث create_season: يسجّل تلقائياً كل الطلاب النشطين في الموسم الجديد،
-- مع الحفاظ على آخر حلقة/مجموعة لهم، وترحيل النقاط إن طُلب ذلك.
create or replace function public.create_season(
  p_name text,
  p_start_date date,
  p_end_date date,
  p_weekly_off_days smallint[],
  p_carry_over_points boolean,
  p_set_as_current boolean
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_season_id uuid;
  v_day date;
begin
  if not public.is_staff() then
    raise exception 'unauthorized';
  end if;

  if p_set_as_current then
    update public.seasons set status = 'archived' where status = 'current';
  end if;

  insert into public.seasons (name, start_date, end_date, weekly_off_days, carry_over_points, status)
  values (
    p_name, p_start_date, p_end_date, p_weekly_off_days, p_carry_over_points,
    case when p_set_as_current then 'current'::season_status else 'archived'::season_status end
  )
  returning id into v_season_id;

  v_day := p_start_date;
  while v_day <= p_end_date loop
    if not (extract(dow from v_day)::smallint = any(p_weekly_off_days)) then
      insert into public.program_days (season_id, day_date) values (v_season_id, v_day);
    end if;
    v_day := v_day + 1;
  end loop;

  insert into public.attendance_auto_points_settings (season_id, is_enabled)
  values (v_season_id, false);

  -- انتقال الطلاب النشطين تلقائياً إلى الموسم الجديد، بآخر حلقة/مجموعة لهم، وترحيل النقاط إن طُلب
  insert into public.student_season_enrollments (student_id, season_id, circle_id, group_id, total_points)
  select
    s.id,
    v_season_id,
    latest.circle_id,
    latest.group_id,
    case when p_carry_over_points then coalesce(latest.total_points, 0) else 0 end
  from public.students s
  left join lateral (
    select e.circle_id, e.group_id, e.total_points
    from public.student_season_enrollments e
    where e.student_id = s.id
    order by e.created_at desc
    limit 1
  ) latest on true
  where s.status = 'active'
  on conflict (student_id, season_id) do nothing;

  insert into public.audit_log (actor_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), 'season.create', 'season', v_season_id, jsonb_build_object('name', p_name, 'set_as_current', p_set_as_current));

  return v_season_id;
end;
$$;
