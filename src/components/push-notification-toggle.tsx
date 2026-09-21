"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, BellOff, BellRing, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  registerServiceWorker,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  isPushNotificationEnabled,
} from "@/lib/push-notifications";

/**
 * شارة واضحة (أيقونة + نص) — تطلب إذن الإشعارات تلقائياً أول ما تُحمَّل
 * الصفحة (إن لم يُسأل المستخدم من قبل)، وتبقى ظاهرة دائماً بنصها بدل
 * الاعتماد على tooltip مخفي.
 */
export function PushNotificationToggleCompact({ className }: { className?: string }) {
  const { isEnabled, isLoading, error, permission, toggle } = usePushToggle({ autoPrompt: true });

  const label = isLoading
    ? "جارِ التحقق..."
    : isEnabled
      ? "الإشعارات مفعّلة"
      : permission === "denied"
        ? "الإشعارات مرفوضة"
        : "فعّل الإشعارات";

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={toggle}
        disabled={isLoading}
        className={cn(
          "flex items-center gap-1.5 h-9 px-3 rounded-(--radius-sm) border-bold border-line-strong text-[12px] font-bold transition-colors disabled:opacity-(--opacity-disabled)",
          isEnabled
            ? "bg-brand text-on-brand"
            : permission === "denied"
              ? "bg-danger/10 text-danger"
              : "bg-surface-raised text-ink-muted hover:bg-surface-sunken",
          className
        )}
      >
        {isLoading ? (
          <Loader2 size={15} className="animate-spin" />
        ) : isEnabled ? (
          <BellRing size={15} />
        ) : (
          <BellOff size={15} />
        )}
        {label}
      </button>
      {error && permission === "denied" && (
        <p className="text-[11px] text-danger max-w-[180px] text-left leading-tight">
          فعّلها يدوياً من إعدادات الموقع بالمتصفح (أيقونة القفل بجانب الرابط)
        </p>
      )}
    </div>
  );
}

/** بطاقة كاملة مع شرح — مناسبة لصفحة الإعدادات. */
export function PushNotificationToggle() {
  const { isEnabled, isLoading, error, toggle } = usePushToggle();

  return (
    <div className="flex flex-col gap-(--space-2)">
      <button
        type="button"
        onClick={toggle}
        disabled={isLoading}
        className={cn(
          "inline-flex items-center gap-2 h-11 px-4 rounded-(--radius-sm) border-bold border-line-strong text-sm font-semibold transition-all disabled:opacity-(--opacity-disabled)",
          isEnabled
            ? "bg-brand text-on-brand shadow-brutal-sm"
            : "bg-surface-raised text-ink hover:bg-surface-sunken shadow-brutal-sm"
        )}
      >
        {isLoading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : isEnabled ? (
          <Bell size={16} />
        ) : (
          <BellOff size={16} />
        )}
        {isEnabled ? "الإشعارات مفعلة" : "فعّل الإشعارات"}
      </button>

      {error && <p className="text-[13px] text-danger">{error}</p>}

      {isEnabled && (
        <p className="text-[13px] text-ink-muted leading-relaxed">
          ستصلك إشعارات فورية على هذا الجهاز عند: تسجيل الحضور والغياب، منح
          الأوسمة والإنجازات، نشر النتائج الشهرية، تغيّر النقاط، ونشر الأخبار.
        </p>
      )}
    </div>
  );
}

function usePushToggle(options?: { autoPrompt?: boolean }) {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [permission, setPermission] = useState<NotificationPermission | null>(null);
  const autoPrompt = options?.autoPrompt ?? false;

  const subscribe = useCallback(async () => {
    setError(null);
    if (!("Notification" in window)) {
      setError("الإشعارات غير مدعومة في هذا المتصفح");
      return false;
    }
    if (Notification.permission === "denied") {
      setPermission("denied");
      setError("تم رفض إذن الإشعارات من إعدادات المتصفح");
      return false;
    }
    try {
      if (Notification.permission !== "granted") {
        const p = await Notification.requestPermission();
        setPermission(p);
        if (p !== "granted") {
          setError("تم رفض إذن الإشعارات");
          return false;
        }
      }
      await subscribeToPushNotifications();
      setIsEnabled(true);
      return true;
    } catch (err) {
      console.error("خطأ في الاشتراك بالإشعارات:", err);
      setError(err instanceof Error ? err.message : "حدث خطأ");
      return false;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (typeof window !== "undefined" && "serviceWorker" in navigator && "Notification" in window) {
          await registerServiceWorker();
          const enabled = await isPushNotificationEnabled();
          if (cancelled) return;
          setIsEnabled(enabled);
          setPermission(Notification.permission);
          if (autoPrompt && !enabled && Notification.permission === "default") {
            await subscribe();
          }
        }
      } catch (err) {
        console.error("خطأ في التحقق من حالة الإشعارات:", err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = async () => {
    setIsLoading(true);
    try {
      if (isEnabled) {
        await unsubscribeFromPushNotifications();
        setIsEnabled(false);
      } else {
        await subscribe();
      }
    } finally {
      setIsLoading(false);
    }
  };

  return { isEnabled, isLoading, error, permission, toggle };
}
