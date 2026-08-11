import { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const sb = await createServerSupabaseClient();
    const { data, error } = await sb
      .from("platform_settings")
      .select("key, value");

    if (error || !data) {
      return Response.json({ logoUrl: null, platformName: "Patzi" });
    }

    const map: Record<string, string> = {};
    for (const row of data) map[row.key] = row.value;

    return Response.json({
      logoUrl: map["logo_url"] || null,
      platformName: map["platform_name"] || "Patzi",
    });
  } catch {
    return Response.json({ logoUrl: null, platformName: "Patzi" });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const sb = await createServerSupabaseClient();

    const { data: { user } } = await sb.auth.getUser();
    if (!user) {
      return Response.json({ ok: false, error: "No autorizado" }, { status: 401 });
    }

    if ("logoUrl" in body) {
      const { error } = await sb
        .from("platform_settings")
        .upsert({ key: "logo_url", value: body.logoUrl ?? "", updated_at: new Date().toISOString() });
      if (error) {
        return Response.json({ ok: false, error: "Acceso denegado" }, { status: 403 });
      }
    }

    if ("platformName" in body) {
      const { error } = await sb
        .from("platform_settings")
        .upsert({ key: "platform_name", value: body.platformName ?? "Patzi", updated_at: new Date().toISOString() });
      if (error) {
        return Response.json({ ok: false, error: "Acceso denegado" }, { status: 403 });
      }
    }

    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false }, { status: 500 });
  }
}
