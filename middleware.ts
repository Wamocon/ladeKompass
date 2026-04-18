import createMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";
import { routing } from "./src/i18n/routing";

const intlMiddleware = createMiddleware(routing);

const PROTECTED_PATHS = ["/dashboard", "/profile", "/settings", "/admin"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Never process API routes — let Next.js handle them directly.
  // Without this guard, next-intl would redirect /api/stations → /de/api/stations (404).
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Strip locale prefix to check protected paths
  const pathnameWithoutLocale = pathname.replace(/^\/(de|en)/, "");

  const isProtected = PROTECTED_PATHS.some(
    (path) =>
      pathnameWithoutLocale === path ||
      pathnameWithoutLocale.startsWith(`${path}/`),
  );

  if (isProtected) {
    // Check for Supabase auth cookie
    const hasSession =
      request.cookies.has("sb-access-token") ||
      request.cookies.get("sb-auth-token")?.value ||
      // Supabase SSR cookie pattern
      [...request.cookies.getAll()].some((c) =>
        c.name.startsWith("sb-") && c.name.endsWith("-auth-token"),
      );

    if (!hasSession) {
      const locale = pathname.match(/^\/(de|en)/)?.[1] ?? "de";
      // Use request.nextUrl.origin (framework-validated) to prevent Host-header injection
      const loginUrl = new URL(`/${locale}/auth/login`, request.nextUrl.origin);
      // Only store the current path as redirectTo — must be a valid internal path
      if (pathname.startsWith("/") && !pathname.startsWith("//")) {
        loginUrl.searchParams.set("redirectTo", pathname);
      }
      return NextResponse.redirect(loginUrl);
    }
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: [
    // Match all paths except Next.js internals, static files, and API routes.
    // API routes must be excluded so next-intl doesn't redirect them to /de/api/...
    "/((?!_next|_vercel|api/|.*\\..*).*)",
  ],
};
