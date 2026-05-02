import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refresh Supabase session in middleware.
 * Avoids `request.cookies.set` — on Vercel Edge that can throw and cause
 * MIDDLEWARE_INVOCATION_FAILED. Only response cookies are updated.
 */
export async function updateSession(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url?.length || !anon?.length) {
    return NextResponse.next({
      request: { headers: request.headers },
    });
  }

  let supabaseResponse = NextResponse.next({
    request: { headers: request.headers },
  });

  try {
    const supabase = createServerClient(url, anon, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          supabaseResponse = NextResponse.next({
            request: { headers: request.headers },
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    });

    // Triggers refresh when needed; can fail on Edge/network — don’t 500 the site.
    try {
      await supabase.auth.getUser();
    } catch {
      /* ignore */
    }
  } catch {
    return NextResponse.next({
      request: { headers: request.headers },
    });
  }

  return supabaseResponse;
}
