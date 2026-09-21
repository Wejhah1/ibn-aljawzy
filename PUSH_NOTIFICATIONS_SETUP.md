# شرح نظام إشعارات Web Push

## المحتوى
1. [التثبيت](#التثبيت)
2. [الإعدادات](#الإعدادات)
3. [الاستخدام](#الاستخدام)
4. [التكامل مع الأحداث](#التكامل-مع-الأحداث)
5. [الحدود والقيود](#الحدود-والقيود)

---

## التثبيت

### 1. تثبيت مكتبة `web-push`

```bash
npm install web-push
```

### 2. إنشاء مفاتيح VAPID

VAPID keys تُستخدم للتحقق من هويتك لخادم المتصفح عند إرسال الإشعارات.

```bash
npx web-push generate-vapid-keys
```

سيعطيك:
```
Public Key: your_public_key_here...
Private Key: your_private_key_here...
```

### 3. تحديث متغيرات البيئة

أضف المفاتيح إلى `.env.local`:

```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_key_here
VAPID_PRIVATE_KEY=your_private_key_here
VAPID_EMAIL=admin@yoursite.com
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. تطبيق Migration قاعدة البيانات

```bash
supabase migration up
```

أو إذا كنت تستخدم Supabase remote:

```bash
supabase db push
```

---

## الإعدادات

### إضافة زر تفعيل الإشعارات

أضف المكون `PushNotificationToggle` في صفحة الإعدادات أو البروفايل:

```tsx
import { PushNotificationToggle } from '@/components/push-notification-toggle';

export default function SettingsPage() {
  return (
    <div>
      <h1>الإعدادات</h1>
      <div className="space-y-4">
        <div>
          <h2>الإشعارات</h2>
          <PushNotificationToggle />
        </div>
      </div>
    </div>
  );
}
```

---

## الاستخدام

### إرسال إشعار عند حدث معين

جميع الدوال موجودة في `src/app/admin/notifications-actions.ts`:

```tsx
// عند تحديث الحضور
import { notifyAttendanceUpdate } from '@/app/admin/notifications-actions';

await notifyAttendanceUpdate(
  studentId,
  'محمد',
  'present' // 'present', 'absent', 'late'
);

// عند منح وسام
import { notifyBadgeAwarded } from '@/app/admin/notifications-actions';

await notifyBadgeAwarded(
  studentId,
  'محمد',
  'الطالب المثالي'
);

// عند إنجاز
import { notifyAchievementUnlocked } from '@/app/admin/notifications-actions';

await notifyAchievementUnlocked(
  studentId,
  'محمد',
  'إكمال 100 ساعة'
);

// عند نشر نتائج
import { notifyMonthlyResultsPublished } from '@/app/admin/notifications-actions';

await notifyMonthlyResultsPublished(
  studentId,
  'محمد',
  'سبتمبر',
  450 // عدد النقاط
);

// عند تغيير النقاط
import { notifyPointsChanged } from '@/app/admin/notifications-actions';

await notifyPointsChanged(
  studentId,
  'محمد',
  +10,
  'إجابة صحيحة'
);

// عند نشر خبر
import { notifyNewsPublished } from '@/app/admin/notifications-actions';

await notifyNewsPublished(
  'عطلة موسمية',
  'سيتم إغلاق الحلقة من الأحد إلى الخميس',
  newsId
);
```

---

## التكامل مع الأحداث

### 1. تحديث صفحة الحضور (attendance)

ابحث عن ملف `src/app/admin/(protected)/attendance/actions.ts` وأضف الإشعار:

```tsx
import { notifyAttendanceUpdate } from '@/app/admin/notifications-actions';

// داخل دالة تسجيل الحضور
export async function markAttendance(/* ... */) {
  // ... الكود الموجود
  
  // أضف هذا:
  await notifyAttendanceUpdate(studentId, studentName, 'present');
}
```

### 2. تحديث صفحة الأوسمة/الإنجازات

ابحث عن `src/app/admin/(protected)/achievements/actions.ts`:

```tsx
import { notifyBadgeAwarded, notifyAchievementUnlocked } from '@/app/admin/notifications-actions';

// عند إضافة وسام
export async function awardBadge(/* ... */) {
  // ... الكود الموجود
  await notifyBadgeAwarded(studentId, studentName, badgeName);
}

// عند إضافة إنجاز
export async function awardAchievement(/* ... */) {
  // ... الكود الموجود
  await notifyAchievementUnlocked(studentId, studentName, achievementName);
}
```

### 3. تحديث صفحة النتائج الشهرية

ابحث عن `src/app/admin/(protected)/results/actions.ts`:

```tsx
import { notifyMonthlyResultsPublished } from '@/app/admin/notifications-actions';

// عند نشر النتائج
export async function publishMonthlyResults(/* ... */) {
  // ... الكود الموجود
  await notifyMonthlyResultsPublished(studentId, studentName, month, points);
}
```

### 4. تحديث صفحة الأخبار

ابحث عن `src/app/admin/(protected)/content/actions.ts`:

```tsx
import { notifyNewsPublished } from '@/app/admin/notifications-actions';

// عند نشر خبر
export async function publishNews(/* ... */) {
  // ... الكود الموجود
  await notifyNewsPublished(title, body, newsId);
}
```

---

## معلومات تقنية

### هيكل قاعدة البيانات

#### جدول `push_subscriptions`
```sql
- id: معرّف فريد
- user_id: معرّف المستخدم
- endpoint: رابط الإرسال من المتصفح
- auth_key: مفتاح المصادقة
- p256dh_key: مفتاح التشفير
- created_at: تاريخ الإنشاء
- last_used_at: آخر استخدام
- user_agent: نوع المتصفح
```

#### جدول `notification_log`
```sql
- id: معرّف فريد
- user_id: المستقبل
- notification_type: نوع الإشعار
- student_id: الطالب المتعلق
- title: عنوان الإشعار
- body: محتوى الإشعار
- data: بيانات إضافية (JSON)
- sent_at: وقت الإرسال
- status: حالة الإرسال
```

---

## الحدود والقيود

### ما يعمل:
✅ iOS Safari 16+
✅ Android Chrome/Firefox
✅ Windows Edge/Chrome
✅ macOS Chrome/Safari (محدود)

### ما لا يعمل:
❌ iOS Chrome (لا يدعم Web Push)
❌ iOS Firefox (لا يدعم Web Push)
❌ متصفحات قديمة

---

## استكشاف الأخطاء

### المشكلة: الإشعارات لا تظهر

1. تحقق من أن Service Worker مسجل:
   ```
   DevTools > Application > Service Workers
   ```

2. تحقق من إذن الإشعارات:
   ```
   DevTools > Console > Notification.permission
   ```

3. تحقق من أن `VAPID_PRIVATE_KEY` معرّف في `.env.local`

### المشكلة: خطأ 401 عند الإرسال

تأكد من أن لديك `SUPABASE_SERVICE_ROLE_KEY` صحيح في `.env.local`

### المشكلة: خطأ في Service Worker

افتح DevTools وتحقق من تبويب "Service Workers" للأخطاء
