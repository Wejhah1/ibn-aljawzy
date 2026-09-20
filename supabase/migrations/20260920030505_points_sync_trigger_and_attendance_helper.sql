-- ============================================================
-- يبقي student_season_enrollments.total_points متزامناً تلقائياً مع point_transactions
-- ============================================================
create or replace function public.sync_enrollment_points()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student_id uuid;
  v_season_id uuid;
begin
  v_student_id := coalesce(new.student_id, old.student_id);
  v_season_id := coalesce(new.season_id, old.season_id);

  update public.student_season_enrollments
  set total_points = coalesce((
    select sum(points) from public.point_transactions
    where student_id = v_student_id and season_id = v_season_id
  ), 0)
  where student_id = v_student_id and season_id = v_season_id;

  return coalesce(new, old);
end;
$$;

create trigger point_transactions_sync_insert
  after insert on public.point_transactions
  for each row execute function public.sync_enrollment_points();

create trigger point_transactions_sync_update
  after update on public.point_transactions
  for each row execute function public.sync_enrollment_points();

create trigger point_transactions_sync_delete
  after delete on public.point_transactions
  for each row execute function public.sync_enrollment_points();

-- ============================================================
-- دالة: تسجيل حضور + تطبيق النقاط التلقائية (إن كانت مفعّلة) بذرّية واحدة
-- ============================================================
create or replace function public.mark_attendance(
  p_student_id uuid,
  p_program_day_id uuid,
  p_status attendance_status,
  p_note text default null
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_season_id uuid;
  v_record_id uuid;
  v_auto record;
  v_points int;
begin
  if not public.is_staff() then
    raise exception 'unauthorized';
  end if;

  select season_id into v_season_id from public.program_days where id = p_program_day_id;

  insert into public.attendance_records (student_id, season_id, program_day_id, status, recorded_by)
  values (p_student_id, v_season_id, p_program_day_id, p_status, auth.uid())
  on conflict (student_id, program_day_id)
  do update set status = excluded.status, recorded_by = excluded.recorded_by, recorded_at = now(), note = p_note
  returning id into v_record_id;

  -- أزل أي نقاط تلقائية سابقة مرتبطة بهذا السجل (لتفادي التراكم عند تغيير الحالة)
  delete from public.point_transactions
  where attendance_record_id = v_record_id and source = 'auto_attendance';

  select * into v_auto from public.attendance_auto_points_settings where season_id = v_season_id;

  if v_auto.is_enabled then
    v_points := case p_status
      when 'present' then v_auto.points_present
      when 'late' then v_auto.points_late
      when 'excused' then v_auto.points_excused
      when 'absent' then v_auto.points_absent
      else 0
    end;

    if v_points is not null and v_points <> 0 then
      insert into public.point_transactions (student_id, season_id, points, source, reason, attendance_record_id, created_by)
      values (p_student_id, v_season_id, v_points, 'auto_attendance', 'نقاط تلقائية للحضور', v_record_id, auth.uid());
    end if;
  end if;

  return v_record_id;
end;
$$;

-- دالة: إضافة نقاط يدوية للطالب
create or replace function public.add_manual_points(
  p_student_id uuid,
  p_season_id uuid,
  p_points int,
  p_reason text default null
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_id uuid;
begin
  if not public.is_staff() then
    raise exception 'unauthorized';
  end if;

  insert into public.point_transactions (student_id, season_id, points, source, reason, created_by)
  values (p_student_id, p_season_id, p_points, 'manual', p_reason, auth.uid())
  returning id into v_id;

  return v_id;
end;
$$;
