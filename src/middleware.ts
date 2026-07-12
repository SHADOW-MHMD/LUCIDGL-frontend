import { NextRequest, NextResponse } from "next/server";

const MOBILE_UA_REGEX =
  /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile|tablet/i;

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Don't redirect if already on /m/ prefix
  if (pathname.startsWith("/m")) return NextResponse.next();

  // Don't redirect API routes, static files, or Next.js internals
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|webp|css|js|woff|woff2)$/)
  ) {
    return NextResponse.next();
  }

  const ua = request.headers.get("user-agent") ?? "";
  const isMobile = MOBILE_UA_REGEX.test(ua);

  if (isMobile) {
    const mobileUrl = request.nextUrl.clone();
    mobileUrl.pathname = "/m";
    return NextResponse.redirect(mobileUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
