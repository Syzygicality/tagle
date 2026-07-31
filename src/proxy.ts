import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/utils/auth";

const PUBLIC_PATHS = ["/login", "/api/login"];

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const authorized = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);

  if (PUBLIC_PATHS.includes(pathname)) {
    if (pathname === "/login" && authorized) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  if (authorized) return NextResponse.next();

  // Fetches expect a status they can react to, not a login page.
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const login = new URL("/login", request.url);
  login.searchParams.set("next", pathname + search);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
