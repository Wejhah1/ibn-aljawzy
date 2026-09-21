import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendPushToGuardians } from "@/lib/push-notify";

/**
 * إرسال إشعار مخصّص يدوياً من الإدارة (مثلاً لكل أولياء الأمور أو مجموعة منهم).
 * ملاحظة: الأحداث التلقائية (حضور/أوسمة/نتائج...) لا تمر من هنا، بل تُرسل
 * مباشرة عبر src/lib/push-notify.ts من داخل server actions — انظر
 * src/app/admin/notifications-actions.ts.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .eq("is_active", true)
      .maybeSingle();
    if (!profile) return NextResponse.json({ error: "ليس لديك صلاحيات لإرسال إشعارات" }, { status: 403 });

    const { guardianPhones, title, body } = await req.json();
    if (!Array.isArray(guardianPhones) || guardianPhones.length === 0 || !title || !body) {
      return NextResponse.json({ error: "معاملات غير صحيحة" }, { status: 400 });
    }

    const result = await sendPushToGuardians(guardianPhones, { title, body }, { notificationType: "news" });
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("خطأ في معالج إرسال الإشعارات:", error);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}
