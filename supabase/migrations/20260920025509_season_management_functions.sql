-- ============================================================
-- دوال إدارة المواسم: إنشاء أطلسي (موسم + أيام البرنامج + إعدادات النقاط التلقائية)
-- وأرشفة/تفعيل ذرّياً لضمان بقاء موسم واحد "حالي" فقط.
-- ملاحظة: create_season استُبدلت لاحقاً بميزة انتقال الطلاب التلقائي
-- (انظر 20260920033556_auto_carry_students_to_new_season.sql)
-- ============================================================

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

  insert into public.audit_log (actor_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), 'season.create', 'season', v_season_id, jsonb_build_object('name', p_name, 'set_as_current', p_set_as_current));

  return v_season_id;
end;
$$;

-- تفعيل موسم كـ"حالي" (يؤرشف الموسم الحالي السابق تلقائياً)
create or replace function public.set_current_season(p_season_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if not public.is_staff() then
    raise exception 'unauthorized';
  end if;

  update public.seasons set status = 'archived' where status = 'current';
  update public.seasons set status = 'current' where id = p_season_id;

  insert into public.audit_log (actor_id, action, entity_type, entity_id)
  values (auth.uid(), 'season.set_current', 'season', p_season_id);
end;
$$;

create or replace function public.archive_season(p_season_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if not public.is_staff() then
    raise exception 'unauthorized';
  end if;

  update public.seasons set status = 'archived' where id = p_season_id;

  insert into public.audit_log (actor_id, action, entity_type, entity_id)
  values (auth.uid(), 'season.archive', 'season', p_season_id);
end;
$$;
