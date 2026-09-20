import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { CommandPalette } from "@/components/search/command-palette";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  // proxy.ts already verified the session with the Supabase Auth server (network call) for
  // this request. Re-checking here with getUser() would add a second network round-trip on
  // every single admin navigation, which is the main cause of perceived lag. getSession() reads
  // the already-verified JWT from cookies locally, no network call.
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user;

  if (!user) redirect("/admin/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex min-h-screen bg-surface">
      <div className="print:hidden contents">
        <Sidebar userName={profile?.full_name ?? user.email ?? "مستخدم"} userRole={profile?.role ?? "data_entry"} />
      </div>
      <div className="flex-1 min-w-0 pb-20 md:pb-0 print:pb-0">{children}</div>
      <div className="print:hidden contents">
        <BottomNav />
        <CommandPalette />
      </div>
    </div>
  );
}
