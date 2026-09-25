// صيغ تواريخ موحدة للموقع: التقويم الهجري (أم القرى) بأرقام لاتينية وبتوقيت الرياض.
// تثبيت التقويم والمنطقة الزمنية يمنع اختلاف النص بين الخادم والمتصفح (Hydration mismatch).
const LOCALE = "ar-SA-u-ca-islamic-umalqura-nu-latn";
const TZ = "Asia/Riyadh";

export const dayFormat = new Intl.DateTimeFormat(LOCALE, { weekday: "long", day: "numeric", month: "long", timeZone: TZ });
export const weekdayShortFormat = new Intl.DateTimeFormat(LOCALE, { weekday: "short", day: "numeric", month: "short", timeZone: TZ });
export const shortDayFormat = new Intl.DateTimeFormat(LOCALE, { day: "numeric", month: "short", timeZone: TZ });
export const longDateFormat = new Intl.DateTimeFormat(LOCALE, { day: "numeric", month: "long", year: "numeric", timeZone: TZ });
export const dateTimeFormat = new Intl.DateTimeFormat(LOCALE, {
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  timeZone: TZ,
});

export function formatDate(value: string | null | undefined, fmt: Intl.DateTimeFormat = dayFormat) {
  if (!value) return "";
  // تواريخ الأيام بصيغة YYYY-MM-DD: نثبّتها على منتصف اليوم لتفادي انزياح المنطقة الزمنية
  return fmt.format(new Date(value.length === 10 ? `${value}T12:00:00` : value));
}
