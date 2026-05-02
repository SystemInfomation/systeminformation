import { ADMIN_SESSION_COOKIE, getAdminPin } from "@/lib/adminAuth";
import { NextRequest, NextResponse } from "next/server";

/** Unlock Race office for a game slug after PIN check. Sets HttpOnly cookie. */
export async function POST(req: NextRequest) {
  let body: { slug?: string; code?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const slug = typeof body.slug === "string" ? body.slug.trim() : "";
  const code = typeof body.code === "string" ? body.code.trim() : "";

  if (!slug) {
    return NextResponse.json({ error: "slug required" }, { status: 400 });
  }

  if (code !== getAdminPin()) {
    return NextResponse.json({ error: "Wrong code" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_SESSION_COOKIE, slug, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
  return res;
}
