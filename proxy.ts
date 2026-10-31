import { NextRequest, NextResponse } from "next/server";

const COOKIE = "cb_session";

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasSession = Boolean(req.cookies.get(COOKIE)?.value);

  const isProtected = pathname.startsWith("/dashboard") || pathname.startsWith("/admin");
  const isAuthPage = ["/signin", "/signup", "/forgot-password"].includes(pathname);

  if (isProtected && !hasSession) {
    const url = new URL("/signin", req.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  if (isAuthPage && hasSession) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/signin", "/signup", "/forgot-password"],
};
