import AdminSidebar from "@/components/admin/AdminSidebar";
import SessionBootstrap from "@/components/auth/SessionBootstrap";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login?next=/admin");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone, role, kyc_status, stable_eligible, is_active")
    .eq("id", user.id)
    .single();

  if (!profile || !profile.is_active) redirect("/auth/login?error=inactive");
  if (profile.role !== "admin") redirect("/dashboard");

  return (
    <div className="premium-shell flex min-h-screen bg-[#F1F5F2]">
      <SessionBootstrap profile={profile} />
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0 w-full">
        {children}
      </div>
    </div>
  );
}
