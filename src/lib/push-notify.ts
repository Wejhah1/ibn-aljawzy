import "server-only";
import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";

let vapidConfigured = false;

function ensureVapidConfigured() {
  if (vapidConfigured) return true;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    console.warn("VAPID keys غير معرّفة — تم تجاوز إرسال إشعار Push.");
    return false;
  }
  webpush.setVapidDetails(process.env.VAPID_EMAIL || "mailto:admin@example.com", publicKey, privateKey);
  vapidConfigured = true;
  return true;
}

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  data?: Record<string, unknown>;
}

export type NotificationType = "attendance" | "badge" | "achievement" | "result" | "points" | "news";

/**
 * يرسل إشعار Push لكل الاشتراكات المرتبطة بأرقام جوال أولياء أمور محددة.
 * الاستهداف يتم حصراً عبر guardian_phone — لا علاقة له بأي حساب Supabase Auth
 * لأن أولياء الأمور لا يملكون حسابات auth.users في هذا النظام.
 */
export async function sendPushToGuardians(
  guardianPhones: string[],
  payload: PushPayload,
  options: { notificationType: NotificationType; studentId?: string }
) {
  const phones = [...new Set(guardianPhones.filter(Boolean))];
  if (phones.length === 0) return { sent: 0, failed: 0 };

  const admin = createAdminClient();
  const { data: subscriptions } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, auth_key, p256dh_key, guardian_phone")
    .in("guardian_phone", phones);

  return dispatch(subscriptions ?? [], payload, {
    ...options,
    logRow: (sub) => ({ guardian_phone: sub.guardian_phone as string, staff_id: null }),
  });
}

/** يرسل إشعار Push لأعضاء فريق الإدارة (profiles.id). */
export async function sendPushToStaff(
  staffIds: string[],
  payload: PushPayload,
  options: { notificationType: NotificationType; studentId?: string }
) {
  const ids = [...new Set(staffIds.filter(Boolean))];
  if (ids.length === 0) return { sent: 0, failed: 0 };

  const admin = createAdminClient();
  const { data: subscriptions } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, auth_key, p256dh_key, staff_id")
    .in("staff_id", ids);

  return dispatch(subscriptions ?? [], payload, {
    ...options,
    logRow: (sub) => ({ guardian_phone: null, staff_id: sub.staff_id as string }),
  });
}

interface BaseSubscription {
  id: number;
  endpoint: string;
  auth_key: string;
  p256dh_key: string;
}

async function dispatch<Sub extends BaseSubscription>(
  subscriptions: Sub[],
  payload: PushPayload,
  options: {
    notificationType: NotificationType;
    studentId?: string;
    logRow: (sub: Sub) => { guardian_phone: string | null; staff_id: string | null };
  }
) {
  if (subscriptions.length === 0) return { sent: 0, failed: 0 };
  if (!ensureVapidConfigured()) return { sent: 0, failed: subscriptions.length };

  const admin = createAdminClient();
  const body = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: payload.icon || "/icons/icon-192.png",
    data: { url: "/", ...payload.data },
  });

  let sent = 0;
  let failed = 0;

  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { auth: sub.auth_key, p256dh: sub.p256dh_key } },
        body
      );
      sent++;

      const owner = options.logRow(sub);
      await admin.from("notification_log").insert({
        ...owner,
        notification_type: options.notificationType,
        student_id: options.studentId ?? null,
        title: payload.title,
        body: payload.body,
        data: (payload.data ?? {}) as never,
        status: "sent",
      });
      await admin.from("push_subscriptions").update({ last_used_at: new Date().toISOString() }).eq("id", sub.id);
    } catch (error: unknown) {
      failed++;
      const statusCode = (error as { statusCode?: number })?.statusCode;
      console.error(`فشل إرسال إشعار push (subscription ${sub.id}):`, error);
      // 404/410 = الاشتراك لم يعد صالحاً (المستخدم ألغى الإذن أو غيّر المتصفح)
      if (statusCode === 404 || statusCode === 410) {
        await admin.from("push_subscriptions").delete().eq("id", sub.id);
      }
    }
  }

  return { sent, failed };
}
