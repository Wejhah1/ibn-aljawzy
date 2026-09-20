import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  ScanLine,
  ClipboardList,
  Search,
  Users,
  CircleDot,
  Trophy,
  Award,
  Printer,
  BarChart3,
  Settings,
  CalendarRange,
  UploadCloud,
  ClipboardCheck,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const PRIMARY_NAV: NavItem[] = [
  { href: "/admin", label: "الرئيسية", icon: LayoutDashboard },
  { href: "/admin/quick-ops", label: "العمليات السريعة", icon: ScanLine },
  { href: "/admin/attendance", label: "كشف الحضور", icon: ClipboardList },
  { href: "/admin/absence-search", label: "بحث الغياب", icon: Search },
];

export const STUDENTS_NAV: NavItem[] = [
  { href: "/admin/students", label: "الطلاب", icon: Users },
  { href: "/admin/circles", label: "الحلقات والمجموعات", icon: CircleDot },
  { href: "/admin/leaderboard", label: "المتصدرون", icon: Trophy },
  { href: "/admin/achievements", label: "الإنجازات والأوسمة والعلامات", icon: Award },
];

export const REPORTS_NAV: NavItem[] = [
  { href: "/admin/printing", label: "الطباعة والشهادات", icon: Printer },
  { href: "/admin/reports", label: "التقارير", icon: BarChart3 },
  { href: "/admin/monthly-results", label: "النتائج الشهرية", icon: ClipboardCheck },
];

export const ADMIN_NAV: NavItem[] = [
  { href: "/admin/seasons", label: "المواسم", icon: CalendarRange },
  { href: "/admin/import", label: "استيراد Excel", icon: UploadCloud },
  { href: "/admin/settings", label: "الإدارة والإعدادات", icon: Settings },
];

export const BOTTOM_NAV: NavItem[] = [
  { href: "/admin", label: "الرئيسية", icon: LayoutDashboard },
  { href: "/admin/quick-ops", label: "عمليات", icon: ScanLine },
  { href: "/admin/attendance", label: "الحضور", icon: ClipboardList },
  { href: "/admin/students", label: "الطلاب", icon: Users },
  { href: "/admin/settings", label: "المزيد", icon: Settings },
];
