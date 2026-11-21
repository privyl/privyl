import Link from "next/link";
import { GITHUB_URL, type Dictionary, type Locale } from "@/i18n/dictionaries";
import { getStars } from "@/lib/server";
import { LanguageSwitch } from "./LanguageSwitch";
import { Logo } from "./Logo";

export async function Navbar({ lang, t }: { lang: Locale; t: Dictionary["nav"] }) {
  const stars = await getStars();
  const link = "rounded-md px-3 py-1.5 text-sm text-muted transition-colors hover:text-fg";

  return (
    <header className="sticky top-3 z-50 px-4">
      <nav
        aria-label={t.menu}
        className="mx-auto flex max-w-5xl items-center gap-2 rounded-2xl border border-line-strong bg-surface/70 px-3 py-2 shadow-lg shadow-black/20 backdrop-blur-xl"
      >
        <Link href={`/${lang}`} className="mr-auto rounded-md px-2 py-1 text-fg">
          <Logo />
        </Link>
        <div className="hidden items-center sm:flex">
          <Link href={`/${lang}/docs`} className={link}>
            {t.docs}
          </Link>
          <Link href={`/${lang}/playground`} className={link}>
            {t.playground}
          </Link>
          <Link href={`/${lang}/benchmark`} className={link}>
            {t.benchmark}
          </Link>
        </div>
        <LanguageSwitch lang={lang} groupLabel={t.languageGroup} />
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border border-line-strong bg-white px-3 py-1.5 text-sm font-medium text-bg transition-opacity hover:opacity-90"
        >
          <GitHubIcon />
          {t.github}
          {stars !== undefined && (
            <span
              className="rounded bg-bg/10 px-1.5 font-mono text-xs"
              aria-label={`${stars} ${t.stars}`}
            >
              ★ {stars}
            </span>
          )}
        </a>
      </nav>
      <div className="mx-auto mt-2 flex max-w-5xl justify-center gap-1 sm:hidden">
        <Link href={`/${lang}/docs`} className={link}>
          {t.docs}
        </Link>
        <Link href={`/${lang}/playground`} className={link}>
          {t.playground}
        </Link>
        <Link href={`/${lang}/benchmark`} className={link}>
          {t.benchmark}
        </Link>
      </div>
    </header>
  );
}

export function GitHubIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="currentColor" aria-hidden="true">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}
