"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PARENT_COOKIE_NAME } from "@/lib/parent-session";

export async function parentLogoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(PARENT_COOKIE_NAME);
  redirect("/portal/login");
}
