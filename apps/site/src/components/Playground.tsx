"use client";

// Live mask/unmask, 100% in the browser.

import { createShield, type Detector } from "privyl";
import { ar } from "privyl/ar";
import { br } from "privyl/br";
import { cl } from "privyl/cl";
import { global } from "privyl/global";
import { mx } from "privyl/mx";
import { pt } from "privyl/pt";
import { us } from "privyl/us";
import { useMemo, useState } from "react";
import type { Dictionary, Locale } from "@/i18n/dictionaries";
import { localizeSegments } from "@/i18n/labels";
import { maskedSegments } from "@/lib/highlight";
import { Highlighted } from "./Highlighted";

const GROUPS: { id: string; label: Record<Locale, string>; detectors: readonly Detector[] }[] = [
  { id: "global", label: { en: "🌐 Global", pt: "🌐 Global" }, detectors: global },
  { id: "br", label: { en: "🇧🇷 Brazil", pt: "🇧🇷 Brasil" }, detectors: br },
  { id: "pt", label: { en: "🇵🇹 Portugal", pt: "🇵🇹 Portugal" }, detectors: pt },
  { id: "ar", label: { en: "🇦🇷 Argentina", pt: "🇦🇷 Argentina" }, detectors: ar },
  { id: "us", label: { en: "🇺🇸 United States", pt: "🇺🇸 Estados Unidos" }, detectors: us },
  { id: "mx", label: { en: "🇲🇽 Mexico", pt: "🇲🇽 México" }, detectors: mx },
  { id: "cl", label: { en: "🇨🇱 Chile", pt: "🇨🇱 Chile" }, detectors: cl },
];

export function Playground({ lang, t }: { lang: Locale; t: Dictionary["playground"] }) {
  const [input, setInput] = useState(t.sample);
  const [response, setResponse] = useState(t.response1);
  const [enabled, setEnabled] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(GROUPS.map((g) => [g.id, true])),
  );

  const shield = useMemo(
    () =>
      createShield({ detectors: GROUPS.filter((g) => enabled[g.id]).flatMap((g) => g.detectors) }),
    [enabled],
  );
  const { text, vault, findings } = useMemo(() => shield.mask(input), [shield, input]);
  const restored = useMemo(() => shield.unmask(response, vault), [shield, response, vault]);

  const box = "card p-5";
  const label = "mb-2 block text-xs uppercase tracking-wider text-muted";

  return (
    <div className="space-y-4">
      <fieldset className="flex flex-wrap items-center gap-4 text-sm">
        <legend className="sr-only">{t.detectors}</legend>
        <span className="text-muted">{t.detectors}:</span>
        {GROUPS.map((g) => (
          <label key={g.id} className="inline-flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={enabled[g.id] ?? false}
              onChange={(e) => setEnabled((s) => ({ ...s, [g.id]: e.target.checked }))}
              className="size-4 accent-[#639cc5]"
            />
            {g.label[lang]}
          </label>
        ))}
        <span className="ml-auto inline-flex items-center gap-2 text-xs text-muted">
          <span className="size-1.5 rounded-full bg-sky" aria-hidden="true" />
          {t.notice}
        </span>
      </fieldset>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className={box}>
          <label htmlFor="pg-input" className={label}>
            {t.input}
          </label>
          <textarea
            id="pg-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            spellCheck={false}
            rows={9}
            className="w-full resize-y bg-transparent font-mono text-sm leading-relaxed outline-none"
          />
        </div>
        <div className={box}>
          <p className={label}>{t.masked}</p>
          <p className="font-mono text-sm leading-relaxed whitespace-pre-wrap" aria-live="polite">
            <Highlighted
              segments={localizeSegments(maskedSegments(text, findings, input), lang)}
              tone="sky"
            />
          </p>
        </div>
      </div>

      <div className={box}>
        <p className={label}>{t.vault}</p>
        {vault.size === 0 ? (
          <p className="text-sm text-muted">{t.empty}</p>
        ) : (
          <table className="w-full text-left font-mono text-sm">
            <thead className="text-xs text-muted">
              <tr>
                <th scope="col" className="pb-2 font-normal">
                  {t.placeholder}
                </th>
                <th scope="col" className="pb-2 font-normal">
                  {t.value}
                </th>
              </tr>
            </thead>
            <tbody>
              {vault.entries().map(([placeholder, value]) => (
                <tr key={placeholder} className="border-t border-line">
                  <td className="py-1.5 pr-4 text-sky">{placeholder}</td>
                  <td className="py-1.5 break-all">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className={box}>
          <label htmlFor="pg-response" className={label}>
            {t.response}
          </label>
          <textarea
            id="pg-response"
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            spellCheck={false}
            rows={5}
            className="w-full resize-y bg-transparent font-mono text-sm leading-relaxed outline-none"
          />
        </div>
        <div className={box}>
          <p className={label}>{t.restored}</p>
          <p className="font-mono text-sm leading-relaxed whitespace-pre-wrap">{restored}</p>
        </div>
      </div>
    </div>
  );
}
