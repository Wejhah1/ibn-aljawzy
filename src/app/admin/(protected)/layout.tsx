import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { CommandPalette } from "@/components/search/command-palette";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/admin/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar userName={profile?.full_name ?? user.email ?? "مستخدم"} userRole={profile?.role ?? "data_entry"} />
      <div className="flex-1 min-w-0 pb-20 md:pb-0">{children}</div>
      <BottomNav />
      <CommandPalette />
    </div>
  );
}
