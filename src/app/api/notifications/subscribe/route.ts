import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyParentToken, PARENT_COOKIE_NAME } from "@/lib/parent-session";

export async function POST(req: NextRequest) {
  try {
    const { endpoint, auth, p256dh } = await req.json();
    if (!endpoint || !auth || !p256dh) {
      return NextResponse.json({ error: "معاملات مفقودة" }, { status: 400 });
    }

    const userAgent = req.headers.get("user-agent") || "";
    const admin = createAdminClient();

    // 1) جرّب هوية الإداري (Supabase Auth عبر كوكي الجلسة)
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { error } = await admin
        .from("push_subscriptions")
        .upsert(
          { staff_id: user.id, guardian_phone: null, endpoint, auth_key: auth, p256dh_key: p256dh, user_agent: userAgent },
          { onConflict: "endpoint" }
        );
      if (error) return NextResponse.json({ error: "فشل حفظ الاشتراك" }, { status: 500 });
      return NextResponse.json({ success: true, role: "staff" });
    }

    // 2) جرّب هوية ولي الأمر (كوكي مخصص موقّع HMAC)
    const cookieStore = await cookies();
    const session = verifyParentToken(cookieStore.get(PARENT_COOKIE_NAME)?.value);

    if (session) {
      const { error } = await admin
        .from("push_subscriptions")
        .upsert(
          { guardian_phone: session.phone, staff_id: null, endpoint, auth_key: auth, p256dh_key: p256dh, user_agent: userAgent },
          { onConflict: "endpoint" }
        );
      if (error) return NextResponse.json({ error: "فشل حفظ الاشتراك" }, { status: 500 });
      return NextResponse.json({ success: true, role: "parent" });
    }

    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  } catch (error) {
    console.error("خطأ في معالج الاشتراك:", error);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}
