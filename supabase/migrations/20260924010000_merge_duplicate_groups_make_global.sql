-- المجموعات كيان مستقل عن الحلقات: ندمج المكرر بالاسم ونفك ارتباطها بالحلقات
with keep as (
  select distinct on (name) id, name from public.groups order by name, created_at, id
)
update public.student_season_enrollments e
set group_id = k.id
from public.groups g
join keep k on k.name = g.name
where e.group_id = g.id and g.id <> k.id;

delete from public.groups g
where g.id not in (select distinct on (name) id from public.groups order by name, created_at, id);

update public.groups set circle_id = null where circle_id is not null;
