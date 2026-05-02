import { NextRequest, NextResponse } from "next/server";

export const ADMIN_SESSION_COOKIE = "derby_admin_slug";

export function getAdminPin(): string {
  return process.env.ADMIN_PIN?.trim() || "1111";
}

export function adminSessionMatchesSlug(request: NextRequest, slug: string): boolean {
  return request.cookies.get(ADMIN_SESSION_COOKIE)?.value === slug;
}

/** Returns 401 JSON if the Race office cookie does not match this slug. */
export function requireRaceOfficeSession(request: NextRequest, slug: string): NextResponse | null {
  if (!adminSessionMatchesSlug(request, slug)) {
    return NextResponse.json({ error: "Race office locked. Enter the code on the admin page." }, { status: 401 });
  }
  return null;
}
