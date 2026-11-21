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
      <div role="tablist" className="mb-4 flex flex-wrap gap-2">
        {scenarios.map((s) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={s.id === current.id}
            onClick={() => setActive(s.id)}
            className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
              s.id === current.id
                ? "border-sky/50 bg-sky/10 text-fg"
                : "border-line text-muted hover:border-line-strong hover:text-fg"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
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
