-- ============================================================
-- الدراسة عن بعد: رابط حلقة افتراضية (Google Meet) لكل حلقة
-- يظهر الرابط لأولياء أمور منتسبي الحلقة في البوابة إذا كان موجوداً و:
--   - الحلقة مفعّلة لحالها (remote_active)، أو
--   - المفتاح العام مفعّل (app_settings: category='remote_study', key='enabled')
-- ============================================================

alter table public.circles
  add column if not exists meeting_url text,
  add column if not exists remote_active boolean not null default false;

alter table public.circles drop constraint if exists circles_meeting_url_https;
alter table public.circles add constraint circles_meeting_url_https
  check (meeting_url is null or meeting_url ~ '^https://');
