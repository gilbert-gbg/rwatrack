import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("auth-token")?.value;

  // No token → redirect to login
  if (!token) {
    const url = new URL("/login", req.url);
    return NextResponse.redirect(url);
  }

  // Has token → allow access
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/hr/:path*",
    "/worker/:path*",
  ],
};
