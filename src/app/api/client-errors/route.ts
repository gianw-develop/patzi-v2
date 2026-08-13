import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  let report: { message: string; digest: string | null; path: string | null; userAgent: string | null };
  try {
    const body = await request.json() as Record<string, unknown>;
    report = {
      message: String(body.message ?? "Unknown client error").slice(0, 500),
      digest: String(body.digest ?? "").slice(0, 120) || null,
      path: String(body.path ?? "").slice(0, 300) || null,
      userAgent: request.headers.get("user-agent")?.slice(0, 300) ?? null,
    };
  } catch {
    console.error("[client-error] Invalid report");
    return new NextResponse(null, { status: 204 });
  }

  console.error("[client-error]", report);

  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { error } = await supabase.from("client_error_reports").insert({
        user_id: user.id,
        message: report.message,
        digest: report.digest,
        path: report.path,
        user_agent: report.userAgent,
      });
      if (error) console.error("[client-error] Could not persist report", error.message);
    }
  } catch (error) {
    console.error("[client-error] Persistence failed", error);
  }

  return new NextResponse(null, { status: 204 });
}
