-- إضافة عمود التصنيف للأخبار بدلاً من عرض عشوائي في الواجهة
alter table public.news_posts
  add column if not exists category text not null default 'إعلان';
