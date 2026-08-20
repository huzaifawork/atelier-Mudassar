import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Two jobs, neither of which is authorization:
 *
 *  1. Refresh the Supabase auth cookie so sessions don't expire mid-use.
 *  2. Bounce signed-out visitors from /admin to /login for a clean experience.
 *
 * The real check lives in the admin layout and in every API route (see
 * lib/adminGuard.ts). Proxy runs ahead of rendering and can be served from a
 * CDN, and Next has had middleware-bypass advisories, so nothing security
 * relevant is allowed to depend on this file alone.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return response;

  const supabase = createServerClient(url, anonKey, {
    // Must match the cookieOptions in lib/authServer.ts exactly — see the
    // comment there for why httpOnly is forced on.
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    },
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, search } = request.nextUrl;

  if (!user && pathname.startsWith("/admin")) {
    const loginUrl = new URL("/login", request.url);
    // Only ever round-trip an internal path, never an attacker-supplied URL.
    loginUrl.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  if (user && pathname === "/login") {
    return NextResponse.redirect(new URL("/admin/gallery", request.url));
  }

  return response;
}

export const config = {
  // Only the screens a human navigates to. Deliberately excludes /api — those
  // routes authenticate themselves, and running a session lookup on every
  // public image request would be pure latency.
  matcher: ["/admin/:path*", "/login"],
};
