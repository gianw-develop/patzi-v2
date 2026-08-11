import { NextResponse, type NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as Record<string, unknown>;
    console.error("[client-error]", {
      message: String(body.message ?? "Unknown client error").slice(0, 500),
      digest: String(body.digest ?? "").slice(0, 120),
      path: String(body.path ?? "").slice(0, 300),
      userAgent: request.headers.get("user-agent")?.slice(0, 300),
    });
  } catch {
    console.error("[client-error] Invalid report");
  }

  return new NextResponse(null, { status: 204 });
}
