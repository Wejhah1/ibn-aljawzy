-- دالة: أول كود 3 أرقام متاح غير مستخدم (000-999)
create or replace function public.next_student_code()
returns char(3)
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_code int;
begin
  select min(c) into v_code
  from generate_series(0, 999) as c
  where not exists (
    select 1 from public.students s where s.code = lpad(c::text, 3, '0')
  );

  if v_code is null then
    raise exception 'لا يوجد كود متاح — تم استخدام جميع الأكواد من 000 إلى 999';
  end if;

  return lpad(v_code::text, 3, '0');
end;
$$;

-- دالة: تسجيل انقطاع طالب (تُنشئ فترة انقطاع وتحدّث الحالة والتسجيل النشط)
create or replace function public.mark_student_dropped_out(p_student_id uuid, p_reason text)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_current_season uuid;
begin
  if not public.is_staff() then
    raise exception 'unauthorized';
  end if;

  select id into v_current_season from public.seasons where status = 'current';

  update public.students set status = 'dropped_out' where id = p_student_id;

  if v_current_season is not null then
    update public.student_season_enrollments
    set status = 'dropped_out'
    where student_id = p_student_id and season_id = v_current_season;
  end if;

  insert into public.dropout_periods (student_id, season_id, reason, recorded_by)
  values (p_student_id, v_current_season, p_reason, auth.uid());

  insert into public.audit_log (actor_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), 'student.dropout', 'student', p_student_id, jsonb_build_object('reason', p_reason));
end;
$$;

-- دالة: إرجاع طالب منقطع
create or replace function public.mark_student_returned(p_student_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_current_season uuid;
begin
  if not public.is_staff() then
    raise exception 'unauthorized';
  end if;

  select id into v_current_season from public.seasons where status = 'current';

  update public.students set status = 'active' where id = p_student_id;

  update public.dropout_periods
  set returned_at = now()
  where student_id = p_student_id and returned_at is null;

  if v_current_season is not null then
    update public.student_season_enrollments
    set status = 'active'
    where student_id = p_student_id and season_id = v_current_season;
  end if;

  insert into public.audit_log (actor_id, action, entity_type, entity_id)
  values (auth.uid(), 'student.return', 'student', p_student_id);
end;
$$;
