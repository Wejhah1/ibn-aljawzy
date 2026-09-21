"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  registerServiceWorker,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  isPushNotificationEnabled,
} from "@/lib/push-notifications";

/** زر مضغوط (أيقونة فقط) — مناسب للرأسية (header). */
export function PushNotificationToggleCompact({ className }: { className?: string }) {
  const { isEnabled, isLoading, error, toggle } = usePushToggle();

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={isLoading}
      title={error ?? (isEnabled ? "الإشعارات مفعلة — اضغط للإيقاف" : "فعّل إشعارات فورية على هذا الجهاز")}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-(--radius-sm) border-bold border-line-strong transition-colors disabled:opacity-(--opacity-disabled)",
        isEnabled ? "bg-brand text-on-brand" : "bg-surface-raised text-ink-muted hover:bg-surface-sunken",
        className
      )}
    >
      {isLoading ? (
        <Loader2 size={16} className="animate-spin" />
      ) : isEnabled ? (
        <Bell size={16} />
      ) : (
        <BellOff size={16} />
      )}
    </button>
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

function usePushToggle() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (typeof window !== "undefined" && "serviceWorker" in navigator) {
          await registerServiceWorker();
          const enabled = await isPushNotificationEnabled();
          if (!cancelled) setIsEnabled(enabled);
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
  }, []);

  const toggle = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (isEnabled) {
        await unsubscribeFromPushNotifications();
        setIsEnabled(false);
      } else {
        if (!("Notification" in window)) {
          setError("الإشعارات غير مدعومة في هذا المتصفح");
          setIsLoading(false);
          return;
        }
        if (Notification.permission === "denied") {
          setError("تم رفض إذن الإشعارات من إعدادات المتصفح");
          setIsLoading(false);
          return;
        }
        if (Notification.permission !== "granted") {
          const permission = await Notification.requestPermission();
          if (permission !== "granted") {
            setError("تم رفض إذن الإشعارات");
            setIsLoading(false);
            return;
          }
        }
        await subscribeToPushNotifications();
        setIsEnabled(true);
      }
    } catch (err) {
      console.error("خطأ في تبديل الإشعارات:", err);
      setError(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setIsLoading(false);
    }
  };

  return { isEnabled, isLoading, error, toggle };
}
