"use client";

// Hero animation: each piece of personal data turns into a protected placeholder, one by one.

import { useEffect, useState } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import { Window } from "./Window";

export type HeroPart = { text: string } | { value: string; placeholder: string; label: string };

const STEP_MS = 900;
const HOLD_STEPS = 4;

export function HeroDemo({ parts, t }: { parts: HeroPart[]; t: Dictionary["heroDemo"] }) {
  const total = parts.filter((p) => "value" in p).length;
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setStep(total);
      return;
    }
    const timer = setInterval(() => setStep((s) => (s >= total + HOLD_STEPS ? 0 : s + 1)), STEP_MS);
    return () => clearInterval(timer);
  }, [total]);

  const masked = Math.min(step, total);
  const exposed = total - masked;
  let index = 0;

  return (
    <Window
      title={t.title}
      className="motion-safe:animate-float"
      actions={
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-mono text-[11px] transition-colors ${
            exposed === 0 ? "bg-sky/10 text-sky" : "bg-alert/10 text-alert-soft"
          }`}
        >
          <span
            className={`size-1.5 rounded-full ${exposed === 0 ? "bg-sky" : "bg-alert"}`}
            aria-hidden="true"
          />
          {exposed === 0 ? t.safe : `${exposed} ${t.exposed}`}
        </span>
      }
    >
      <div className="space-y-4 p-5 text-left sm:p-6">
        <div className="flex gap-3">
          <span
            className="grid size-7 shrink-0 place-items-center rounded-full bg-elevated text-xs text-muted"
            aria-hidden="true"
          >
            {t.you.slice(0, 1)}
          </span>
          <div>
            <p className="mb-1 text-xs text-muted">{t.you}</p>
            <p className="font-mono text-[13px] leading-7 sm:text-sm">
              {parts.map((p, i) => {
                if (!("value" in p)) return <span key={i}>{p.text}</span>;
                const isMasked = index++ < masked;
                return (
                  <mark
                    key={i}
                    title={p.label}
                    className={`token rounded px-1 ${
                      isMasked
                        ? "bg-sky/12 text-sky ring-1 ring-sky/30"
                        : "bg-alert/12 text-alert-soft ring-1 ring-alert/30"
                    }`}
                  >
                    {isMasked ? p.placeholder : p.value}
                  </mark>
                );
              })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 border-t border-line pt-4 text-xs text-muted">
          <svg
            viewBox="0 0 24 24"
            className="size-4 text-sky"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden="true"
          >
            <path
              d="M12 3 4 6v6c0 4.4 3.4 8.2 8 9 4.6-.8 8-4.6 8-9V6l-8-3Z"
              strokeLinejoin="round"
            />
            <path d="m9 12 2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {t.footer}
        </div>
      </div>
    </Window>
  );
}
