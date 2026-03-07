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
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("platform_settings")
      .select("key, value")
      .in("key", ["logo_url", "platform_name"]);

    if (error) {
      return Response.json({ logoUrl: null, platformName: "Patzi" });
    }

    const settings = (data ?? []).reduce((acc: Record<string, string>, row) => {
      acc[row.key] = row.value;
      return acc;
    }, {});

    return Response.json({
      logoUrl: settings["logo_url"] || null,
      platformName: settings["platform_name"] || "Patzi",
    });
  } catch {
    return Response.json({ logoUrl: null, platformName: "Patzi" });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const supabase = getSupabase();

    const updates = Object.entries(body as Record<string, string>).map(([key, value]) => ({
      key,
      value,
      updated_at: new Date().toISOString(),
    }));

    for (const row of updates) {
      await supabase
        .from("platform_settings")
        .upsert(row, { onConflict: "key" });
    }

    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false }, { status: 500 });
  }
}
