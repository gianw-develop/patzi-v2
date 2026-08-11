import Sidebar from "@/components/dashboard/Sidebar";
import SessionBootstrap from "@/components/auth/SessionBootstrap";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login?next=/dashboard");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone, role, kyc_status, stable_eligible, is_active")
    .eq("id", user.id)
    .single();

  if (!profile || !profile.is_active) redirect("/auth/login?error=inactive");

  return (
    <div className="premium-shell flex min-h-screen bg-background">
      <SessionBootstrap profile={profile} />
      <Sidebar />
      {/* On mobile sidebar is fixed/overlay so content spans full width */}
      <div className="flex-1 flex flex-col min-w-0 w-full">
        {children}
      </div>
    </div>
  );
}
