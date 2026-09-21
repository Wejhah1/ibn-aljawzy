import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyParentToken, PARENT_COOKIE_NAME } from "@/lib/parent-session";

export async function POST(req: NextRequest) {
  try {
    const { endpoint } = await req.json();
    if (!endpoint) {
      return NextResponse.json({ error: "endpoint مفقودة" }, { status: 400 });
    }

    const admin = createAdminClient();

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await admin.from("push_subscriptions").delete().eq("staff_id", user.id).eq("endpoint", endpoint);
      return NextResponse.json({ success: true });
    }

    const cookieStore = await cookies();
    const session = verifyParentToken(cookieStore.get(PARENT_COOKIE_NAME)?.value);

    if (session) {
      await admin.from("push_subscriptions").delete().eq("guardian_phone", session.phone).eq("endpoint", endpoint);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  } catch (error) {
    console.error("خطأ في معالج إلغاء الاشتراك:", error);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}
