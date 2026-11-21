import type { ReactNode } from "react";
import { LockIcon } from "./ui";

/**
 * A dark app window frame used for product mockups.
 * With `url`, it looks like a browser (address bar in the middle); otherwise like a terminal.
 */
export function Window({
  title,
  url,
  children,
  className = "",
  actions,
}: {
  title?: string;
  url?: string;
  children: ReactNode;
  className?: string;
  actions?: ReactNode;
}) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border border-line-strong bg-surface shadow-[0_40px_100px_-40px] shadow-black ring-1 ring-sky/5 ${className}`}
    >
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 border-b border-line bg-gradient-to-b from-elevated/70 to-elevated/30 px-4 py-2.5">
        <div className="flex gap-1.5" aria-hidden="true">
          <span className="size-2.5 rounded-full bg-[#ff5f57]/70" />
          <span className="size-2.5 rounded-full bg-[#febc2e]/70" />
          <span className="size-2.5 rounded-full bg-[#28c840]/70" />
        </div>
        {url ? (
          <span className="mx-auto inline-flex max-w-full min-w-0 items-center gap-1.5 rounded-lg border border-line bg-bg/60 px-3 py-1 font-mono text-[11px] text-muted sm:min-w-72 sm:justify-center">
            <LockIcon className="size-3 shrink-0 text-sky" />
            <span className="truncate">{url}</span>
          </span>
        ) : (
          <span className="truncate font-mono text-xs text-muted">{title}</span>
        )}
        <div className="flex min-w-[3.25rem] justify-end">{actions}</div>
      </div>
      {children}
    </div>
  );
}
