# أمثلة على التكامل مع نظام الإشعارات

هذا الملف يحتوي على أمثلة عملية لكيفية إضافة الإشعارات إلى الأحداث المختلفة.

## مثال 1: إضافة إشعار عند تسجيل الحضور

**الملف:** `src/app/admin/(protected)/attendance/actions.ts`

```typescript
'use server';

import { createClient } from '@/lib/supabase/server';
import { notifyAttendanceUpdate } from '@/app/admin/notifications-actions'; // أضف هذا

export async function markStudentAttendance(
  studentId: string,
  programDayId: string,
  status: 'present' | 'absent' | 'late'
) {
  const supabase = await createClient();

  // ... الكود الموجود ...

  // جلب معلومات الطالب للإشعار
  const { data: student } = await supabase
    .from('students')
    .select('full_name')
    .eq('id', studentId)
    .single();

  // أرسل الإشعار
  if (student) {
    await notifyAttendanceUpdate(studentId, student.full_name, status, programDayId);
  }

  // ... باقي الكود ...
}
```

---

## مثال 2: إضافة إشعار عند منح وسام

**الملف:** `src/app/admin/(protected)/achievements/actions.ts`

```typescript
'use server';

import { createClient } from '@/lib/supabase/server';
import { notifyBadgeAwarded } from '@/app/admin/notifications-actions'; // أضف هذا

export async function awardBadgeToStudent(
  studentId: string,
  badgeId: string
) {
  const supabase = await createClient();

  // ... الكود الموجود ...

  // جلب معلومات الطالب والوسام
  const { data: student } = await supabase
    .from('students')
    .select('full_name')
    .eq('id', studentId)
    .single();

  const { data: badge } = await supabase
    .from('badges')
    .select('name')
    .eq('id', badgeId)
    .single();

  // أرسل الإشعار
  if (student && badge) {
    await notifyBadgeAwarded(studentId, student.full_name, badge.name);
  }

  // ... باقي الكود ...
}
```

---

## مثال 3: إضافة إشعار عند نشر النتائج الشهرية

**الملف:** `src/app/admin/(protected)/results/actions.ts`

```typescript
'use server';

import { createClient } from '@/lib/supabase/server';
import { notifyMonthlyResultsPublished } from '@/app/admin/notifications-actions'; // أضف هذا

export async function publishMonthlyResults(seasonId: string) {
  const supabase = await createClient();

  // ... الكود الموجود ...

  // بعد نشر النتائج، أرسل إشعارات لجميع الطلاب
  const { data: results } = await supabase
    .from('monthly_results')
    .select(`
      student_id,
      total_points,
      students(full_name)
    `)
    .eq('season_id', seasonId);

  // أرسل إشعار لكل طالب
  if (results) {
    for (const result of results) {
      await notifyMonthlyResultsPublished(
        result.student_id,
        result.students.full_name,
        'سبتمبر', // تغيير الشهر حسب الحاجة
        result.total_points
      );
    }
  }

  // ... باقي الكود ...
}
```

---

## مثال 4: إضافة إشعار عند نشر خبر

**الملف:** `src/app/admin/(protected)/content/actions.ts`

```typescript
'use server';

import { createClient } from '@/lib/supabase/server';
import { notifyNewsPublished } from '@/app/admin/notifications-actions'; // أضف هذا

export async function publishNews(
  title: string,
  content: string,
  circleId?: string
) {
  const supabase = await createClient();

  // ... أنشئ الخبر ...
  const { data: news } = await supabase
    .from('news')
    .insert({
      title,
      content,
      circle_id: circleId,
      published_at: new Date().toISOString()
    })
    .select()
    .single();

  // أرسل إشعار لجميع المستخدمين
  if (news) {
    await notifyNewsPublished(
      title,
      content.substring(0, 100), // أول 100 حرف كـ preview
      news.id
    );
  }

  // ... باقي الكود ...
}
```

---

## مثال 5: إضافة إشعار عند تغيير النقاط

**الملف:** `src/app/admin/(protected)/points/actions.ts` (أو حيث يتم تحديث النقاط)

```typescript
'use server';

import { createClient } from '@/lib/supabase/server';
import { notifyPointsChanged } from '@/app/admin/notifications-actions'; // أضف هذا

export async function addPointsToStudent(
  studentId: string,
  points: number,
  reason: string
) {
  const supabase = await createClient();

  // ... الكود الموجود ...

  // جلب معلومات الطالب
  const { data: student } = await supabase
    .from('students')
    .select('full_name')
    .eq('id', studentId)
    .single();

  // أرسل الإشعار
  if (student) {
    await notifyPointsChanged(studentId, student.full_name, points, reason);
  }

  // ... باقي الكود ...
}
```

---

## مثال 6: استخدام المكون في الواجهة

**لإضافة زر تفعيل الإشعارات في صفحة الإعدادات:**

```tsx
// src/app/parent/settings/page.tsx

import { PushNotificationToggle } from '@/components/push-notification-toggle';

export default function SettingsPage() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">الإعدادات</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">الإشعارات</h2>
        <p className="text-gray-600 mb-4">
          فعل الإشعارات لتلقي تحديثات فورية عن ابنك أو ابنتك
        </p>
        <PushNotificationToggle />
      </div>

      {/* أقسام أخرى */}
    </div>
  );
}
```

---

## نصائح التطبيق

### 1. احذر من إرسال إشعارات كثيرة
- لا ترسل أكثر من إشعار واحد في الدقيقة للمستخدم الواحد
- استخدم التجميع للأحداث المتشابهة

### 2. تأكد من الأسماء الصحيحة
```typescript
// صحيح ✓
await notifyAttendanceUpdate(
  '550e8400-e29b-41d4-a716-446655440000', // UUID صحيح
  'محمد أحمد',
  'present'
);

// خطأ ✗
await notifyAttendanceUpdate(
  'student1', // ليس UUID
  'محمد',
  'present'
);
```

### 3. معالجة الأخطاء
```typescript
try {
  await notifyAttendanceUpdate(studentId, studentName, 'present');
} catch (error) {
  console.error('فشل إرسال الإشعار:', error);
  // لا تمنع العملية الأساسية من الاستمرار
}
```

### 4. الاختبار المحلي
عند تطوير:
- افتح DevTools > Application > Service Workers للتحقق من التسجيل
- افتح DevTools > Console واستدعِ `Notification.permission` للتحقق من الإذن
- جرب إرسال إشعار باستخدام الدالة مباشرة

---

## استكشاف الأخطاء الشائعة

### الإشعار لا يظهر بعد التفعيل

```typescript
// تحقق من:
1. Notification.permission === 'granted'
2. navigator.serviceWorker.ready !== null
3. NEXT_PUBLIC_VAPID_PUBLIC_KEY معرّف في .env.local
```

### الإشعارات تظهر لكن النقر لا يعمل

```typescript
// تأكد من أن data.url معرّف بشكل صحيح
await notifyAttendanceUpdate(
  studentId,
  name,
  'present',
  // data يجب أن يحتوي على url
);
```

### خطأ CORS عند الإرسال

تأكد من أن `NEXT_PUBLIC_APP_URL` معرّفة بشكل صحيح في `.env.local`
