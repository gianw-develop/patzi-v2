import { createClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function GET() {
  try {
    const sb = getSupabase();
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
    const sb = getSupabase();

    if ("logoUrl" in body) {
      await sb
        .from("platform_settings")
        .upsert({ key: "logo_url", value: body.logoUrl ?? "", updated_at: new Date().toISOString() });
    }

    if ("platformName" in body) {
      await sb
        .from("platform_settings")
        .upsert({ key: "platform_name", value: body.platformName ?? "Patzi", updated_at: new Date().toISOString() });
    }

    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false }, { status: 500 });
  }
}
