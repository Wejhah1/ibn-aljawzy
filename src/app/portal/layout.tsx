import type { Metadata } from "next";

// بيان تطبيق مستقل للبوابة: عند إضافتها للشاشة الرئيسية تفتح على البوابة لا على لوحة الإدارة
export const metadata: Metadata = {
  title: "بوابة ولي الأمر — حلقات ابن الجوزي",
  manifest: "/portal.webmanifest",
};

export default function PortalLayout({ children }: LayoutProps<"/portal">) {
  return children;
}
