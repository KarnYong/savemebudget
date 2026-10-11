import { NextResponse, type NextRequest } from "next/server";

// Optimistic check only (cookie presence). The real session check happens in
// requireUser() on the page and in every Server Action.
export function proxy(request: NextRequest) {
  if (!request.cookies.has("sb_session")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = { matcher: "/dashboard/:path*" };
