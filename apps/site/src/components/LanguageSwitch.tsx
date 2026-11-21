"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Locale } from "@/i18n/dictionaries";
import { FlagBR, FlagUS } from "./Flags";

const OPTIONS: { lang: Locale; label: string; hrefLang: string; Flag: typeof FlagBR }[] = [
  { lang: "pt", label: "Português", hrefLang: "pt-BR", Flag: FlagBR },
  { lang: "en", label: "English", hrefLang: "en", Flag: FlagUS },
];

/** Two flags: the current language is highlighted, the other one switches the page. */
export function LanguageSwitch({ lang, groupLabel }: { lang: Locale; groupLabel: string }) {
  const pathname = usePathname();

  return (
    <div
      role="group"
      aria-label={groupLabel}
      className="flex items-center gap-0.5 rounded-lg border border-line bg-surface/60 p-0.5"
    >
      {OPTIONS.map(({ lang: option, label, hrefLang, Flag }) => {
        const active = option === lang;
        const href = pathname.replace(/^\/(en|pt)(?=\/|$)/, `/${option}`);
        return (
          <Link
            key={option}
            href={href}
            hrefLang={hrefLang}
            aria-label={label}
            aria-current={active ? "true" : undefined}
            title={label}
            className={`rounded-md p-1.5 transition-all ${
              active
                ? "bg-elevated ring-1 ring-sky/40"
                : "opacity-50 grayscale hover:opacity-100 hover:grayscale-0"
            }`}
          >
            <Flag className="h-3.5 w-5 rounded-[2px]" />
          </Link>
        );
      })}
    </div>
  );
}
