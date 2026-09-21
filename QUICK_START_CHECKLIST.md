# قائمة البدء السريع ✅

اتبع هذه الخطوات بالترتيب لتفعيل الإشعارات:

## المرحلة 1: الإعداد الأساسي (5 دقائق)

- [ ] **1.1** افتح Terminal وانتقل للمجلد:
  ```bash
  cd your-project-path
  ```

- [ ] **1.2** انسخ ملف متغيرات البيئة:
  ```bash
  cp .env.local.example .env.local
  ```

- [ ] **1.3** أنشئ مفاتيح VAPID:
  ```bash
  npx web-push generate-vapid-keys
  ```

- [ ] **1.4** انسخ المفاتيح:
  - انسخ **Public Key** إلى `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
  - انسخ **Private Key** إلى `VAPID_PRIVATE_KEY`

- [ ] **1.5** أكمل `.env.local`:
  ```env
  NEXT_PUBLIC_VAPID_PUBLIC_KEY=xxxxx    # المفتاح من 1.4
  VAPID_PRIVATE_KEY=xxxxx               # المفتاح من 1.4
  VAPID_EMAIL=admin@yoursite.com        # أي بريد صحيح
  NEXT_PUBLIC_APP_URL=http://localhost:3000
  ```

---

## المرحلة 2: قاعدة البيانات (2 دقيقة)

اختر **واحد** من الخيارين:

### الخيار A: إذا كنت تستخدم Supabase CLI
```bash
supabase db push
```

### الخيار B: إذا كنت تستخدم Supabase Web Console
1. اذهب إلى [Supabase Dashboard](https://app.supabase.com)
2. اختر مشروعك
3. اذهب إلى **SQL Editor**
4. انسخ محتوى الملف: `supabase/migrations/20260921000000_push_notifications.sql`
5. الصق وشغّل

---

## المرحلة 3: الواجهة (3 دقائق)

### إضافة زر الإشعارات في صفحة الإعدادات:

**الملف:** `src/app/parent/settings/page.tsx` أو أي صفحة تريد

```tsx
import { PushNotificationToggle } from '@/components/push-notification-toggle';

export default function SettingsPage() {
  return (
    <div className="p-6">
      <h1>الإعدادات</h1>
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-4">الإشعارات</h2>
        <PushNotificationToggle />
      </div>
    </div>
  );
}
```

---

## المرحلة 4: الاختبار (2 دقيقة)

- [ ] **4.1** ابدأ الخادم:
  ```bash
  npm run dev
  ```

- [ ] **4.2** افتح المتصفح وانتقل إلى الصفحة التي أضفت الزر فيها

- [ ] **4.3** اضغط على "فعل الإشعارات"

- [ ] **4.4** اقبل الإذن من المتصفح

- [ ] **4.5** تحقق من DevTools:
  ```
  DevTools > Application > Service Workers
  # يجب أن ترى sw.js مسجل
  ```

---

## المرحلة 5: التكامل مع الأحداث (5-10 دقائق)

اختر الأحداث التي تريد إرسال إشعارات عند حدوثها:

### الخيار 1: الحضور والغياب
**الملف:** `src/app/admin/(protected)/attendance/actions.ts`

أضف في دالة تسجيل الحضور:
```typescript
import { notifyAttendanceUpdate } from '@/app/admin/notifications-actions';

// بعد تسجيل الحضور
await notifyAttendanceUpdate(studentId, studentName, 'present');
```

---

### الخيار 2: الأوسمة والإنجازات
**الملف:** `src/app/admin/(protected)/achievements/actions.ts`

```typescript
import { notifyBadgeAwarded, notifyAchievementUnlocked } from '@/app/admin/notifications-actions';

// عند منح وسام
await notifyBadgeAwarded(studentId, studentName, badgeName);

// عند إنجاز
await notifyAchievementUnlocked(studentId, studentName, achievementName);
```

---

### الخيار 3: النتائج الشهرية
**الملف:** `src/app/admin/(protected)/results/actions.ts` أو مكان نشر النتائج

```typescript
import { notifyMonthlyResultsPublished } from '@/app/admin/notifications-actions';

await notifyMonthlyResultsPublished(studentId, studentName, 'سبتمبر', totalPoints);
```

---

### الخيار 4: الأخبار
**الملف:** `src/app/admin/(protected)/content/actions.ts`

```typescript
import { notifyNewsPublished } from '@/app/admin/notifications-actions';

await notifyNewsPublished(title, body, newsId);
```

---

## المرحلة 6: الاختبار النهائي (5 دقائق)

- [ ] **6.1** احفظ جميع التغييرات

- [ ] **6.2** أعد تشغيل الخادم (إن لزم)

- [ ] **6.3** اختبر حدث واحد:
  - سجل حضور طالب
  - أو أضف وسام
  - أو غير النقاط

- [ ] **6.4** تحقق من استقبال الإشعار على متصفح آخر أو جهاز آخر

- [ ] **6.5** اضغط على الإشعار وتحقق من أنه يفتح الصفحة الصحيحة

---

## استكشاف الأخطاء السريع

### ❌ الإشعارات لا تظهر

✅ **الحل:**
1. تحقق من `Notification.permission` في Console
2. تحقق من Service Worker في DevTools
3. أعد تحميل الصفحة

### ❌ خطأ عند الضغط على "فعل الإشعارات"

✅ **الحل:**
1. تحقق من أن `VAPID_PUBLIC_KEY` معرّف في `.env.local`
2. أعد تشغيل الخادم
3. امسح cache المتصفح

### ❌ تظهر رسالة "غير مصرح"

✅ **الحل:**
1. تحقق من أنك مسجل دخول
2. تحقق من توفر `SUPABASE_SERVICE_ROLE_KEY` في `.env.local`

---

## الملفات المهمة للرجوع لها

| الملف | الغرض |
|------|--------|
| `PUSH_NOTIFICATIONS_SETUP.md` | شرح مفصل |
| `INTEGRATION_EXAMPLES.md` | أمثلة عملية |
| `PUSH_NOTIFICATIONS_SUMMARY.md` | ملخص شامل |
| `src/app/admin/notifications-actions.ts` | جميع الدوال |
| `src/components/push-notification-toggle.tsx` | الزر |

---

## ✅ تم!

بعد إكمال جميع المراحل، لديك نظام إشعارات كامل وآمن وموثوق!

### الخطوات التالية (اختيارية):
- [ ] إضافة المزيد من الأحداث
- [ ] تخصيص رسائل الإشعارات
- [ ] إضافة لوحة تحكم للإشعارات
- [ ] اختبار على أجهزة مختلفة

---

## 📞 هل تحتاج مساعدة؟

اقرأ:
1. `PUSH_NOTIFICATIONS_SETUP.md` - للأسئلة التقنية
2. `INTEGRATION_EXAMPLES.md` - للأمثلة
3. DevTools Console - للأخطاء
