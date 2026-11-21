// Sends visitors without a language in the URL to /pt or /en, based on their browser language.

import { NextResponse, type NextRequest } from "next/server";
import { locales } from "./i18n/dictionaries";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasLocale = locales.some((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`));
  if (hasLocale) return;

  const accept = (request.headers.get("accept-language") ?? "").trim().toLowerCase();
  const lang = accept.startsWith("pt") ? "pt" : "en";
  request.nextUrl.pathname = `/${lang}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(request.nextUrl);
}

export const config = {
  // Skip Next.js internals and files with an extension (icons, images...).
  matcher: ["/((?!_next|.*\\..*).*)"],
};
