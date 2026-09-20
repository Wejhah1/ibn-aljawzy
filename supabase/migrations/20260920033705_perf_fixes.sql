-- تحسين أداء سياسة RLS: تفادي إعادة تقييم auth.uid() لكل صف
drop policy if exists "self read own profile" on public.profiles;
create policy "self read own profile" on public.profiles for select
  using (id = (select auth.uid()));

-- فهارس للمفاتيح الأجنبية الأكثر استخداماً في الاستعلامات (طلاب/نقاط/علامات)
create index if not exists student_achievements_student_idx on public.student_achievements (student_id, season_id);
create index if not exists student_badges_student_idx on public.student_badges (student_id, season_id);
create index if not exists student_flags_student_idx on public.student_flags (student_id);
create index if not exists dropout_periods_student_idx on public.dropout_periods (student_id);
create index if not exists monthly_results_student_idx on public.monthly_results (student_id, season_id);
create index if not exists groups_circle_idx on public.groups (circle_id);
create index if not exists circles_season_idx on public.circles (season_id);
