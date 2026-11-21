"use client";

import { useState } from "react";
import { CheckIcon, CopyIcon } from "./ui";

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
    <div className="inline-flex items-center gap-3 rounded-xl border border-line-strong bg-surface/80 py-1.5 pr-1.5 pl-4 font-mono text-sm shadow-[inset_0_1px_0] shadow-white/5 backdrop-blur">
      <span className="select-all">
        <span className="text-muted select-none">$ </span>
        {command}
      </span>
      <button
        type="button"
        onClick={copy}
        aria-label={`${copyLabel}: ${command}`}
        className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 font-sans text-xs transition-colors ${
          copied
            ? "border-sky/40 bg-sky/10 text-sky"
            : "border-line text-muted hover:border-sky/50 hover:text-fg"
        }`}
      >
        {copied ? <CheckIcon className="size-3.5" /> : <CopyIcon />}
        <span aria-live="polite">{copied ? copiedLabel : copyLabel}</span>
      </button>
    </div>
  );
}
