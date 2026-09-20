-- ============================================================
-- دفعة ميزات ٢: تخصيص الحلقات/المجموعات، مدة ظهور الأوسمة، تاريخ الاختبار،
-- لوحة متصدرين عامة (حلقات/مجموعات)، حذف الملاحظات
-- ============================================================

-- ---------- 1) تخصيص الحلقات: لون + معلم (بالإضافة إلى القائد الموجود) ----------
alter table public.circles
  add column if not exists color_token text not null default 'group-1',
  add column if not exists teacher_name text,
  add column if not exists teacher_phone text;

-- ---------- 2) مدة ظهور الأوسمة/الإنجازات/العلامات في القوائم والمتصدرين ----------
-- null = تظهر دائماً. القيمة بالأيام من تاريخ المنح، وتُطبَّق فقط على القوائم
-- والمتصدرين وأي مكان يظهر فيه اسم الطالب — أما صفحة الطالب الشخصية وبوابة ولي
-- الأمر فتبقى تعرض كل شيء دائماً بغض النظر عن هذه المدة.
alter table public.badges add column if not exists display_duration_days int;
alter table public.achievements add column if not exists display_duration_days int;
alter table public.flags add column if not exists display_duration_days int;

-- ---------- 3) تاريخ الاختبار في النتائج الشهرية ----------
alter table public.monthly_results add column if not exists exam_date date;

-- ---------- 4) حذف ملاحظات ولي الأمر/الإدارة (كل طرف يحذف رسائله هو) ----------
-- سياسة "staff manage parent notes" الحالية تغطي حذف الإدارة لرسائلها (وأي رسالة)
-- عبر RLS بالفعل. جهة ولي الأمر تستخدم عميل الخدمة (service role) في actions.ts
-- ويُتحقق من الملكية هناك برمجياً، فلا حاجة لسياسة RLS إضافية لحذفه.

-- ---------- 5) لوحة متصدرين عامة (طلاب + مجموعات + حلقات) لعرضها لولي الأمر دون تسجيل دخول ----------
create or replace function public.public_leaderboard()
returns json
language sql
stable
security definer
set search_path = public
as $$
  with cur_season as (
    select id, name from public.seasons where status = 'current' limit 1
  ),
  student_stats as (
    select
      s.id, s.full_name, s.code,
      c.name as circle_name,
      e.total_points as points,
      coalesce(round(
        100.0 * count(*) filter (where ar.status in ('present','late')) /
        nullif(count(*) filter (where pd.is_holiday = false), 0)
      ), 0) as attendance_rate,
      count(distinct sa.id) as achievements_count,
      (
        select coalesce(json_agg(json_build_object('name', b.name, 'icon', b.icon) order by sb.awarded_at desc), '[]'::json)
        from public.student_badges sb
        join public.badges b on b.id = sb.badge_id
        where sb.student_id = s.id and sb.season_id = e.season_id
          and (b.display_duration_days is null or sb.awarded_at > now() - (b.display_duration_days || ' days')::interval)
      ) as badges
    from public.student_season_enrollments e
    join public.students s on s.id = e.student_id
    left join public.circles c on c.id = e.circle_id
    left join public.program_days pd on pd.season_id = e.season_id
    left join public.attendance_records ar on ar.student_id = s.id and ar.program_day_id = pd.id
    left join public.student_achievements sa on sa.student_id = s.id and sa.season_id = e.season_id
    where e.season_id = (select id from cur_season) and e.status = 'active' and s.status = 'active'
    group by s.id, s.full_name, s.code, c.name, e.total_points, e.season_id
  ),
  group_stats as (
    select g.id, g.name, g.color_token, coalesce(sum(e.total_points), 0) as total_points
    from public.groups g
    join public.student_season_enrollments e on e.group_id = g.id and e.season_id = (select id from cur_season)
    group by g.id, g.name, g.color_token
    having count(e.id) > 0
  ),
  circle_stats as (
    select c.id, c.name, c.color_token, coalesce(sum(e.total_points), 0) as total_points
    from public.circles c
    join public.student_season_enrollments e on e.circle_id = c.id and e.season_id = (select id from cur_season)
    group by c.id, c.name, c.color_token
    having count(e.id) > 0
  )
  select json_build_object(
    'season_name', (select name from cur_season),
    'students', (select coalesce(json_agg(row_to_json(student_stats)), '[]'::json) from student_stats),
    'groups', (select coalesce(json_agg(row_to_json(group_stats) order by total_points desc), '[]'::json) from group_stats),
    'circles', (select coalesce(json_agg(row_to_json(circle_stats) order by total_points desc), '[]'::json) from circle_stats)
  );
$$;

grant execute on function public.public_leaderboard() to anon, authenticated;
