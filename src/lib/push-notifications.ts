const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

export async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    console.warn("Service Workers غير مدعوم في هذا المتصفح");
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    return registration;
  } catch (error) {
    console.error("فشل تسجيل Service Worker:", error);
    return null;
  }
}

export async function subscribeToPushNotifications() {
  if (!VAPID_PUBLIC_KEY) {
    throw new Error("خدمة الإشعارات غير مفعّلة على هذا الموقع بعد");
  }

  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
  }

  await savePushSubscription(subscription);
  return subscription;
}

export async function unsubscribeFromPushNotifications() {
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();

  if (subscription) {
    await deletePushSubscription(subscription);
    await subscription.unsubscribe();
  }
}

export async function isPushNotificationEnabled() {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return !!subscription;
  } catch {
    return false;
  }
}

function bufferToBase64(buffer: ArrayBuffer | null) {
  if (!buffer) return "";
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return window.btoa(binary);
}

async function savePushSubscription(subscription: PushSubscription) {
  const response = await fetch("/api/notifications/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      endpoint: subscription.endpoint,
      auth: bufferToBase64(subscription.getKey("auth")),
      p256dh: bufferToBase64(subscription.getKey("p256dh")),
    }),
  });

  if (!response.ok) {
    const { error } = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error || "فشل حفظ الاشتراك");
  }
}

async function deletePushSubscription(subscription: PushSubscription) {
  await fetch("/api/notifications/unsubscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint: subscription.endpoint }),
  });
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}
