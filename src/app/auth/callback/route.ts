import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase-server";

const EMAIL_OTP_TYPES = new Set<EmailOtpType>([
  "email",
  "email_change",
  "invite",
  "magiclink",
  "recovery",
  "signup",
]);

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const requestedType = requestUrl.searchParams.get("type");
  const requestedNext = requestUrl.searchParams.get("next") ?? "/dashboard";
  const next = requestedNext.startsWith("/") && !requestedNext.startsWith("//")
    ? requestedNext
    : "/dashboard";

  const supabase = await createServerSupabaseClient();
  let confirmationError: string | null = null;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    confirmationError = error?.message ?? null;
  } else if (tokenHash && requestedType && EMAIL_OTP_TYPES.has(requestedType as EmailOtpType)) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: requestedType as EmailOtpType,
    });
    confirmationError = error?.message ?? null;
  } else {
    confirmationError =
      requestUrl.searchParams.get("error_description")
      ?? requestUrl.searchParams.get("error")
      ?? "Missing confirmation credentials";
  }

  if (!confirmationError) {
    return NextResponse.redirect(new URL(next, requestUrl.origin));
  }

  console.error("[auth-confirmation]", {
    message: confirmationError,
    hasCode: Boolean(code),
    hasTokenHash: Boolean(tokenHash),
    type: requestedType,
    userAgent: request.headers.get("user-agent")?.slice(0, 300),
  });

  const loginUrl = new URL("/auth/login", requestUrl.origin);
  loginUrl.searchParams.set("error", "confirmation");
  return NextResponse.redirect(loginUrl);
}
