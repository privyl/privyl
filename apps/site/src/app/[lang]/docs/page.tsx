import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDictionary, isLocale } from "@/i18n/dictionaries";
import { getDocs } from "@/i18n/docs";

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  return isLocale(lang) ? { title: getDictionary(lang).docs.title } : {};
}

/** Turns `inline code` into <code> elements. */
function Prose({ text }: { text: string }) {
  return (
    <>
      {text.split(/(`[^`]+`)/).map((part, i) =>
        part.startsWith("`") ? (
          <code
            key={i}
            className="rounded bg-elevated px-1.5 py-0.5 font-mono text-[0.85em] text-sky"
          >
            {part.slice(1, -1)}
          </code>
        ) : (
          part
        ),
      )}
    </>
  );
}

export default async function DocsPage({ params }: Props) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = getDictionary(lang).docs;
  const sections = getDocs(lang);

  return (
    <div className="mx-auto grid max-w-6xl gap-12 px-6 pt-16 lg:grid-cols-[200px_1fr]">
      <nav aria-label={t.toc} className="hidden lg:block">
        <div className="sticky top-28">
          <p className="mb-3 text-xs uppercase tracking-wider text-muted">{t.toc}</p>
          <ul className="space-y-2 text-sm">
            {sections.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="text-muted transition-colors hover:text-fg">
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <article className="min-w-0">
        <h1 className="text-4xl font-medium tracking-tight">{t.title}</h1>
        {sections.map((s) => (
          <section key={s.id} id={s.id} className="mt-14 scroll-mt-28">
            <h2 className="text-2xl font-medium tracking-tight">
              <a href={`#${s.id}`} className="hover:text-sky">
                {s.title}
              </a>
            </h2>
            {s.body.map((p) => (
              <p key={p} className="mt-3 leading-relaxed text-muted">
                <Prose text={p} />
              </p>
            ))}
            {s.code && (
              <pre className="mt-5 overflow-x-auto rounded-xl border border-line bg-surface p-4 font-mono text-sm leading-relaxed text-fg/90">
                <code>{s.code}</code>
              </pre>
            )}
          </section>
        ))}
      </article>
    </div>
  );
}
