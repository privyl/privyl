import Link from "next/link";
import { GITHUB_URL, type Dictionary, type Locale } from "@/i18n/dictionaries";
import { Logo } from "./Logo";

export function Footer({ lang, t }: { lang: Locale; t: Dictionary }) {
  const link = "text-muted transition-colors hover:text-fg";
  return (
    <footer className="mt-32 border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-12 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Logo />
          <p className="text-sm text-muted">{t.footer.tagline}</p>
        </div>
        <nav className="grid grid-cols-2 gap-x-12 gap-y-2 text-sm" aria-label="Footer">
          <Link href={`/${lang}/docs`} className={link}>
            {t.nav.docs}
          </Link>
          <a href={GITHUB_URL} className={link}>
            {t.nav.github}
          </a>
          <Link href={`/${lang}/playground`} className={link}>
            {t.nav.playground}
          </Link>
          <a href={`${GITHUB_URL}/blob/main/SECURITY.md`} className={link}>
            {t.trust.security}
          </a>
          <Link href={`/${lang}/benchmark`} className={link}>
            {t.nav.benchmark}
          </Link>
          <a href={`${GITHUB_URL}/blob/main/LICENSE`} className={link}>
            {t.footer.license}
          </a>
        </nav>
      </div>
      <p className="mx-auto max-w-6xl px-6 pb-10 text-xs text-muted">
        © {new Date().getFullYear()} Privyl · {t.trust.disclaimer}
      </p>
    </footer>
  );
}
