import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import { getSafeReturnTo } from "@/lib/safe-return-to";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = getSessionCookie(request);
  const safeReturnTo = getSafeReturnTo(
    request.nextUrl.searchParams.get("returnTo") ?? undefined,
  );

  if (!sessionCookie && pathname.startsWith("/back-office")) {
    return NextResponse.redirect(new URL("/staff-login", request.url));
  }

  if (sessionCookie && pathname === "/sign-up") {
    return NextResponse.redirect(new URL(safeReturnTo ?? "/", request.url));
  }

  if (sessionCookie && pathname === "/sign-in") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/back-office/:path*", "/staff-login", "/sign-in", "/sign-up"], // Specify the routes the middleware applies to
};
