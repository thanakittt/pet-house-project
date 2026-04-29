import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = getSessionCookie(request);

  if (!sessionCookie && pathname.startsWith("/back-office")) {
    return NextResponse.redirect(new URL("/staff-login", request.url));
  }

  if (sessionCookie && pathname.startsWith("/staff-login")) {
    return NextResponse.redirect(
      new URL("/back-office/appointments", request.url),
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/back-office/:path*", "/staff-login"], // Specify the routes the middleware applies to
};
