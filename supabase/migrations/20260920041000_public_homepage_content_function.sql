create or replace function public.public_homepage_content()
returns json
language sql
stable
security definer
set search_path = public
as $$
  select json_build_object(
    'hero_title', (select value from public.app_settings where category = 'homepage' and key = 'hero_title'),
    'hero_subtitle', (select value from public.app_settings where category = 'homepage' and key = 'hero_subtitle'),
    'logo_url', (select value from public.app_settings where category = 'homepage' and key = 'logo_url')
  );
$$;

grant execute on function public.public_homepage_content() to anon;
