import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { token } = req.nextauth;
    // If not logged in, let NextAuth handle redirect
    if (!token) return NextResponse.next();

    // Role-based routing
    const role = token.role;
    const url = req.nextUrl.clone();
    if (url.pathname === "/auth") {
      // Already on login page, let through
      return NextResponse.next();
    }
    if (role === "QAC" && !url.pathname.startsWith("/qc")) {
      url.pathname = "/qc";
    }
    if (role === "HOD" && !url.pathname.startsWith("/hod")) {
      url.pathname = "/hod";
      return NextResponse.redirect(url);
    }
    // Allow both FACULTY and KPI_COORDINATOR to access faculty routes
    if (
      (role === "FACULTY" || role === "KPI_COORDINATOR") &&
      !url.pathname.startsWith("/faculty")
    ) {
      url.pathname = "/faculty";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  },
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - auth (auth pages)
     */
    "/((?!api|_next|favicon.ico|auth|.*\\.).*)",
  ],
};
