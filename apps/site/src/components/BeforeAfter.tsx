"use client";

import { useState } from "react";
import type { Segment } from "@/lib/highlight";
import { Highlighted } from "./Highlighted";

export interface Scenario {
  id: string;
  label: string;
  raw: Segment[];
  masked: Segment[];
  count: number;
}

/** Tabs with real examples, already masked on the server by the real library. */
export function BeforeAfterTabs({
  scenarios,
  before,
  after,
  foundLabel,
}: {
  scenarios: Scenario[];
  before: string;
  after: string;
  foundLabel: string;
}) {
  const [active, setActive] = useState(scenarios[0]?.id);
  const current = scenarios.find((s) => s.id === active) ?? scenarios[0];
  if (!current) return null;

  return (
    <div>
      <div role="tablist" className="segmented mb-5 flex-wrap">
        {scenarios.map((s) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={s.id === current.id}
            onClick={() => setActive(s.id)}
          >
            {s.label}
          </button>
        ))}
      </div>
      <div className="relative grid gap-4 md:grid-cols-2">
        {/* Arrow between the two panels (desktop) */}
        <span
          aria-hidden="true"
          className="absolute top-1/2 left-1/2 z-10 hidden size-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-line-strong bg-elevated text-sky shadow-lg shadow-black/40 md:grid"
        >
          <svg viewBox="0 0 16 16" className="size-4">
            <path
              d="M3 8h9.5M8.5 4l4 4-4 4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <Panel label={before} tone="alert" badge={`${current.count} ${foundLabel}`}>
          <Highlighted segments={current.raw} tone="alert" />
        </Panel>
        <Panel label={after} tone="sky" badge="0">
          <Highlighted segments={current.masked} tone="sky" />
        </Panel>
      </div>
    </div>
  );
}

function Panel({
  label,
  tone,
  badge,
  children,
}: {
  label: string;
  tone: "alert" | "sky";
  badge: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card p-6">
      <p className="mb-4 flex items-center justify-between text-xs uppercase tracking-wider text-muted">
        <span className="flex items-center gap-2">
          <span
            className={`size-1.5 rounded-full ${tone === "alert" ? "bg-alert" : "bg-sky"}`}
            aria-hidden="true"
          />
          {label}
        </span>
        <span
          className={`rounded-full px-2 py-0.5 font-mono normal-case tracking-normal ${
            tone === "alert" ? "bg-alert/10 text-alert-soft" : "bg-sky/10 text-sky"
          }`}
        >
          {badge}
        </span>
      </p>
      <p className="font-mono text-sm leading-loose break-words whitespace-pre-wrap">{children}</p>
    </div>
  );
}
