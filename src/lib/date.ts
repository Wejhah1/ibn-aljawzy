// تواريخ الموقع: هجري بالأرقام (أم القرى) بتوقيت الرياض.
// التقويم والمنطقة الزمنية محددان صراحةً لأن خادم Node يعرض ar-SA ميلادياً بينما المتصفح يعرضه هجرياً.
const LOCALE = "ar-SA-u-ca-islamic-umalqura";
const TZ = "Asia/Riyadh";
// التواريخ المخزّنة كـ "YYYY-MM-DD" تُقرأ عند منتصف النهار المحلي حتى لا يزحف اليوم بسبب فرق التوقيت.
function toDate(value: string | Date) {
  if (value instanceof Date) return value;
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00`) : new Date(value);
}

/** ٢١/٣/١٤٤٨ هـ */
export function hijriDate(value: string | Date) {
  return toDate(value).toLocaleDateString(LOCALE, { day: "numeric", month: "numeric", year: "numeric", timeZone: TZ });
}

/** ٢١/٣ */
export function hijriShort(value: string | Date) {
  return toDate(value).toLocaleDateString(LOCALE, { day: "numeric", month: "numeric", timeZone: TZ });
}

/** الأحد ٢١/٣ */
export function hijriWeekday(value: string | Date) {
  const d = toDate(value);
  return `${d.toLocaleDateString(LOCALE, { weekday: "long", timeZone: TZ })} ${hijriShort(d)}`;
}

/** رقم اليوم الهجري فقط: ٢١ */
export function hijriDay(value: string | Date) {
  return toDate(value).toLocaleDateString(LOCALE, { day: "numeric", timeZone: TZ });
}

/** ٢١/٣ ٤:٣٠ م */
export function hijriDateTime(value: string | Date) {
  const d = toDate(value);
  return `${hijriShort(d)} ${d.toLocaleTimeString(LOCALE, { hour: "numeric", minute: "2-digit", timeZone: TZ })}`;
}

/** الاثنين ١٠/٤/١٤٤٨ هـ */
export function hijriFull(value: string | Date) {
  const d = toDate(value);
  return `${d.toLocaleDateString(LOCALE, { weekday: "long", timeZone: TZ })} ${hijriDate(d)}`;
}
