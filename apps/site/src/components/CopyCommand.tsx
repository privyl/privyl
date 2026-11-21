"use client";

import { useState } from "react";

/** An install command with a copy button. */
export function CopyCommand({
  command,
  copyLabel,
  copiedLabel,
}: {
  command: string;
  copyLabel: string;
  copiedLabel: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard can be blocked (old browsers, permissions). The command is still selectable.
    }
  };

  return (
    <div className="inline-flex items-center gap-3 rounded-xl border border-line-strong bg-surface/80 py-1.5 pr-1.5 pl-4 font-mono text-sm">
      <span className="select-all">
        <span className="text-muted select-none">$ </span>
        {command}
      </span>
      <button
        type="button"
        onClick={copy}
        aria-label={`${copyLabel}: ${command}`}
        className="rounded-lg border border-line px-2.5 py-1 text-xs text-muted transition-colors hover:border-sky/50 hover:text-fg"
      >
        <span aria-live="polite">{copied ? `✓ ${copiedLabel}` : copyLabel}</span>
      </button>
    </div>
  );
}
