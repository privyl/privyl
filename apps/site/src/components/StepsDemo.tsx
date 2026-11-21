"use client";

// "How it works": a browser window with three steps (mask, ask the AI, restore).
// Every text here was produced on the server by the real library; this file only shows it.
// The active step advances by itself (a CSS progress bar) and pauses on hover or keyboard focus.

import { siClaude, siGooglegemini } from "simple-icons";
import { useEffect, useState } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Segment } from "@/lib/highlight";
import { BrandSvg, siOpenai, type BrandIcon } from "./brands";
import { CheckIcon, LockIcon, Pill, ShieldIcon } from "./ui";
import { Window } from "./Window";

export interface StepsData {
  input: Segment[];
  masked: Segment[];
  reply: Segment[];
  restored: Segment[];
  findings: { label: string; placeholder: string; value: string; confidence: number }[];
}

const MODELS: { name: string; icon: BrandIcon }[] = [
  { name: "Claude", icon: siClaude },
  { name: "ChatGPT", icon: siOpenai },
  { name: "Gemini", icon: siGooglegemini },
];

export function StepsDemo({ data, t }: { data: StepsData; t: Dictionary["how"] }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [auto, setAuto] = useState(false);
  const [model, setModel] = useState(0);

  // Auto-advance only when the visitor has not asked for reduced motion.
  useEffect(() => {
    setAuto(!window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  const go = (i: number) => {
    setActive(i);
    setAuto(false); // the visitor took control: stop the slideshow
  };

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className={paused ? "paused" : ""}
    >
      <Window url={t.ui.url}>
        {/* Stepper */}
        <div
          role="tablist"
          aria-label={t.ui.steps}
          className="flex items-stretch gap-1 overflow-x-auto border-b border-line bg-bg/40 px-2 sm:px-4"
        >
          {t.steps.map((step, i) => {
            const selected = i === active;
            const done = i < active;
            return (
              <div key={step.tab} className="flex shrink-0 items-center">
                {i > 0 && (
                  <svg
                    viewBox="0 0 16 16"
                    className="mx-1 size-3.5 text-line-strong sm:mx-3"
                    aria-hidden="true"
                  >
                    <path
                      d="m6 3.5 4.5 4.5L6 12.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
                <button
                  type="button"
                  role="tab"
                  id={`step-tab-${i}`}
                  aria-selected={selected}
                  aria-controls={`step-panel-${i}`}
                  onClick={() => go(i)}
                  className={`relative flex items-center gap-2.5 px-2 py-3.5 text-sm transition-colors ${
                    selected ? "text-fg" : "text-muted hover:text-fg"
                  }`}
                >
                  <span
                    className={`grid size-6 place-items-center rounded-full border font-mono text-[11px] transition-colors ${
                      selected
                        ? "border-sky/50 bg-sky/15 text-sky"
                        : done
                          ? "border-sky/30 bg-sky/10 text-sky"
                          : "border-line-strong text-muted"
                    }`}
                  >
                    {done ? <CheckIcon className="size-3" /> : i + 1}
                  </span>
                  {step.tab}
                  <span className="absolute inset-x-0 -bottom-px h-px overflow-hidden bg-transparent">
                    {selected && (
                      <span
                        key={`${active}-${auto}`}
                        className={`block h-full bg-sky ${auto ? "step-progress" : ""}`}
                        onAnimationEnd={() => setActive((a) => (a + 1) % t.steps.length)}
                      />
                    )}
                  </span>
                </button>
              </div>
            );
          })}
        </div>

        <div className="dot-grid">
          {t.steps.map((step, i) => (
            <div
              key={step.tab}
              role="tabpanel"
              id={`step-panel-${i}`}
              aria-labelledby={`step-tab-${i}`}
              hidden={i !== active}
              className="grid gap-4 p-4 sm:p-6 md:min-h-[27rem] md:grid-cols-[1fr_17.5rem]"
            >
              <div className="min-w-0 motion-safe:animate-fade-up">
                <h3 className="text-lg font-medium">{step.title}</h3>
                <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted text-pretty">
                  {step.body}
                </p>
                <div className="mt-5">
                  {i === 0 && <MaskMain data={data} t={t} />}
                  {i === 1 && <AskMain data={data} t={t} model={model} setModel={setModel} />}
                  {i === 2 && <RestoreMain data={data} t={t} />}
                </div>
              </div>
              <aside className="min-w-0 motion-safe:animate-fade-up">
                {i === 0 && <MaskSide data={data} t={t} />}
                {i === 1 && <AskSide t={t} model={MODELS[model]?.name ?? ""} />}
                {i === 2 && <RestoreSide data={data} t={t} />}
              </aside>
            </div>
          ))}
        </div>

        {/* The one line of code behind the active step */}
        <div className="flex items-center gap-3 overflow-x-auto border-t border-line bg-bg/60 px-4 py-3 font-mono text-xs whitespace-nowrap sm:px-6">
          <span className="text-muted select-none">{String(active + 1).padStart(2, "0")}</span>
          <code className="text-fg/90">{CODE[active]}</code>
        </div>
      </Window>
    </div>
  );
}

const CODE = [
  "const { text, vault } = shield.mask(message);",
  "const answer = await ai.ask(text); // any model",
  "const reply = shield.unmask(answer, vault);",
];

/* ---------- small building blocks ---------- */

function Panel({
  label,
  right,
  children,
}: {
  label: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-line bg-surface/90 shadow-[inset_0_1px_0] shadow-white/[0.03]">
      <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-2.5">
        <span className="text-xs text-muted">{label}</span>
        {right}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function Text({ segments, tone }: { segments: Segment[]; tone: "alert" | "sky" | "restored" }) {
  const styles = {
    alert: "bg-alert/12 text-alert-soft ring-1 ring-alert/30",
    sky: "bg-sky/12 text-sky ring-1 ring-sky/30",
    restored: "bg-white/[0.06] text-fg ring-1 ring-white/15",
  };
  return (
    <p className="font-mono text-[13px] leading-7 break-words">
      {segments.map((s, i) =>
        s.label ? (
          <mark key={i} title={s.label} className={`rounded px-1 ${styles[tone]}`}>
            {s.text}
          </mark>
        ) : (
          <span key={i}>{s.text}</span>
        ),
      )}
    </p>
  );
}

/* ---------- step 1: mask ---------- */

function MaskMain({ data, t }: { data: StepsData; t: Dictionary["how"] }) {
  return (
    <div className="space-y-3">
      <Panel
        label={t.ui.message}
        right={
          <Pill tone="alert" dot>
            {data.findings.length} {t.ui.exposed}
          </Pill>
        }
      >
        <Text segments={data.input} tone="alert" />
      </Panel>
      <Connector />
      <Panel
        label={t.ui.maskedText}
        right={
          <Pill tone="sky" dot>
            0 {t.ui.exposed}
          </Pill>
        }
      >
        <Text segments={data.masked} tone="sky" />
      </Panel>
    </div>
  );
}

function MaskSide({ data, t }: { data: StepsData; t: Dictionary["how"] }) {
  return (
    <div className="flex h-full flex-col gap-3">
      <Panel
        label={t.ui.detected}
        right={<span className="font-mono text-[11px] text-muted">{t.ui.confidence}</span>}
      >
        <ul className="space-y-3">
          {data.findings.map((f) => (
            <li key={f.placeholder}>
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="truncate text-fg">{f.label}</span>
                <span className="font-mono text-sky">{f.placeholder}</span>
              </div>
              <div className="mt-1.5 flex items-center gap-2">
                {/* SVG bar: the CSP blocks inline style attributes, but SVG attributes are fine. */}
                <svg className="h-1 flex-1" aria-hidden="true">
                  <rect width="100%" height="100%" rx="2" className="fill-white/[0.06]" />
                  <rect
                    width={`${Math.round(f.confidence * 100)}%`}
                    height="100%"
                    rx="2"
                    className="fill-sky"
                  />
                </svg>
                <span className="w-9 text-right font-mono text-[11px] text-muted tabular-nums">
                  {Math.round(f.confidence * 100)}%
                </span>
              </div>
            </li>
          ))}
        </ul>
      </Panel>
      <div className="mt-auto flex items-center gap-3 rounded-xl border border-sky/20 bg-sky/[0.06] px-4 py-3">
        <LockIcon className="size-4 shrink-0 text-sky" />
        <p className="text-xs leading-snug">
          <span className="text-fg">
            {t.ui.vault}: {data.findings.length} {t.ui.items}
          </span>
          <br />
          <span className="text-muted">{t.ui.vaultNote}</span>
        </p>
      </div>
    </div>
  );
}

/* ---------- step 2: ask the AI ---------- */

function AskMain({
  data,
  t,
  model,
  setModel,
}: {
  data: StepsData;
  t: Dictionary["how"];
  model: number;
  setModel: (i: number) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs text-muted">{t.ui.model}</span>
        <div role="tablist" aria-label={t.ui.model} className="segmented">
          {MODELS.map((m, i) => (
            <button
              key={m.name}
              type="button"
              role="tab"
              aria-selected={i === model}
              onClick={() => setModel(i)}
              className="inline-flex items-center gap-2"
            >
              <BrandSvg icon={m.icon} className="size-3.5" />
              {m.name}
            </button>
          ))}
        </div>
      </div>
      <Panel
        label={t.ui.payload}
        right={<span className="font-mono text-[11px] text-muted">{MODELS[model]?.name}</span>}
      >
        <Text segments={data.masked} tone="sky" />
      </Panel>
      <p className="text-xs text-muted">{t.ui.understands}</p>
    </div>
  );
}

// Fixed classes (not inline styles), so they pass the Content Security Policy.
const STAGE_DELAY = [
  "[animation-delay:150ms]",
  "[animation-delay:450ms]",
  "[animation-delay:750ms]",
];

function AskSide({ t, model }: { t: Dictionary["how"]; model: string }) {
  return (
    <div className="flex h-full flex-col gap-3">
      <Panel label={t.ui.timeline}>
        <ol className="space-y-3.5">
          {t.ui.stages.map((stage, i) => (
            <li
              key={stage}
              className={`flex items-center gap-3 text-sm motion-safe:animate-fade-up ${STAGE_DELAY[i] ?? ""}`}
            >
              <span className="grid size-5 shrink-0 place-items-center rounded-full bg-sky/15 text-sky">
                <CheckIcon className="size-3" />
              </span>
              <span className="text-fg/90">{stage.replace("{model}", model)}</span>
            </li>
          ))}
        </ol>
      </Panel>
      <div className="mt-auto rounded-xl border border-line bg-surface/90 px-4 py-4">
        <p className="text-4xl font-medium tracking-tight text-sky tabular-nums">0</p>
        <p className="mt-1 text-xs text-muted">{t.ui.zero}</p>
      </div>
    </div>
  );
}

/* ---------- step 3: restore ---------- */

function RestoreMain({ data, t }: { data: StepsData; t: Dictionary["how"] }) {
  return (
    <div className="space-y-3">
      <Panel label={t.ui.aiReply} right={<Pill tone="sky">{t.ui.placeholdersOnly}</Pill>}>
        <Text segments={data.reply} tone="sky" />
      </Panel>
      <Connector />
      <Panel
        label={t.ui.finalReply}
        right={
          <span className="inline-flex items-center gap-1 text-[11px] text-sky">
            <CheckIcon className="size-3" />
            {t.ui.restoredLabel}
          </span>
        }
      >
        <Text segments={data.restored} tone="restored" />
      </Panel>
    </div>
  );
}

function RestoreSide({ data, t }: { data: StepsData; t: Dictionary["how"] }) {
  return (
    <div className="flex h-full flex-col gap-3">
      <Panel label={t.ui.fromVault}>
        <ul className="space-y-2.5">
          {data.findings.map((f) => (
            <li
              key={f.placeholder}
              className="grid grid-cols-[auto_auto_1fr] items-center gap-2 text-xs"
            >
              <span className="font-mono text-sky">{f.placeholder}</span>
              <svg viewBox="0 0 16 16" className="size-3.5 text-muted" aria-hidden="true">
                <path
                  d="M3 8h9.5M8.5 4l4 4-4 4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="truncate text-right font-mono text-fg/90">{f.value}</span>
            </li>
          ))}
        </ul>
      </Panel>
      <div className="mt-auto flex items-start gap-3 rounded-xl border border-sky/20 bg-sky/[0.06] px-4 py-3">
        <ShieldIcon className="mt-0.5 size-4 shrink-0 text-sky" />
        <p className="text-xs leading-snug text-muted">{t.ui.robust}</p>
      </div>
    </div>
  );
}

/** Vertical connector between two panels: a line with an arrow head. */
function Connector() {
  return (
    <div className="flex justify-center" aria-hidden="true">
      <svg viewBox="0 0 24 28" className="h-7 w-6 text-sky/70">
        <path d="M12 2v20" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 3" />
        <path
          d="m7 18 5 5 5-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
