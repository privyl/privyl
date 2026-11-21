"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Locale } from "@/i18n/dictionaries";

/** Links to the same page in the other language. */
export function LanguageSwitch({
  lang,
  label,
  ariaLabel,
}: {
  lang: Locale;
  label: string;
  ariaLabel: string;
}) {
  const pathname = usePathname();
  const other: Locale = lang === "en" ? "pt" : "en";
  const href = pathname.replace(/^\/(en|pt)(?=\/|$)/, `/${other}`);

  return (
    <Link
      href={href}
      hrefLang={other === "pt" ? "pt-BR" : "en"}
      aria-label={ariaLabel}
      className="rounded-md px-3 py-1.5 text-sm text-muted transition-colors hover:text-fg"
    >
      {label}
    </Link>
  );
}
