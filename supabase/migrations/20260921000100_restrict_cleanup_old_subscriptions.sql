-- cleanup_old_subscriptions كانت قابلة للاستدعاء من anon/authenticated عبر RPC
-- بشكل غير مقصود (صلاحية PUBLIC الافتراضية لأي دالة SQL جديدة). دالة صيانة
-- داخلية فقط لذا نقصرها على service_role.
revoke execute on function public.cleanup_old_subscriptions() from public, anon, authenticated;
