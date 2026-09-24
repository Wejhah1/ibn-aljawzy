-- نتيجة الاختبار الشهري: رقم (percentage) أو نص (status_text مثل "لم يختبر")
alter table public.monthly_results alter column percentage drop not null;
alter table public.monthly_results add column if not exists status_text text;
alter table public.monthly_results drop constraint if exists monthly_results_value_check;
alter table public.monthly_results add constraint monthly_results_value_check
  check (percentage is not null or status_text is not null);
