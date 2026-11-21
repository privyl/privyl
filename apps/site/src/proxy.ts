// Runs before every page request:
// 1. Sends visitors without a language in the URL to /pt or /en, based on their browser language.
// 2. Sets the Content Security Policy with a fresh random "nonce" (number used once).
//    Next.js adds this nonce to its own inline scripts, so they run; any script injected
//    by an attacker would not have it, so the browser blocks it.

import { NextResponse, type NextRequest } from "next/server";
import { locales } from "./i18n/dictionaries";

/**
 * Content Security Policy: the browser refuses anything not listed here.
 * - Scripts only from this site, and inline scripts only with this request's nonce.
 * - connect-src 'self': the page cannot send data to any other domain. This is what makes
 *   "nothing is uploaded" verifiable in the browser's DevTools.
 * - frame-ancestors 'none': nobody can embed the site in an iframe (clickjacking).
 */
function buildCsp(nonce: string): string {
  // In development React needs eval() for better error messages. Never in production.
  const isDev = process.env.NODE_ENV === "development";
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    `style-src 'self' 'nonce-${nonce}'`,
    "img-src 'self' data:",
    "font-src 'self'",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasLocale = locales.some((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`));

  if (!hasLocale) {
    const accept = (request.headers.get("accept-language") ?? "").trim().toLowerCase();
    const lang = accept.startsWith("pt") ? "pt" : "en";
    request.nextUrl.pathname = `/${lang}${pathname === "/" ? "" : pathname}`;
    return NextResponse.redirect(request.nextUrl);
  }

  const nonce = btoa(crypto.randomUUID());
  const csp = buildCsp(nonce);

  // Next.js reads the nonce from the request's CSP header while rendering the page.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    {
      // Skip Next.js internals and files with an extension (icons, images...).
      source: "/((?!_next|.*\\..*).*)",
      // Skip link prefetches: they are not full page loads.
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
