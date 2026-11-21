import type { ReactNode } from "react";

/** A dark app/terminal window frame used for product mockups. */
export function Window({
  title,
  children,
  className = "",
  actions,
}: {
  title: string;
  children: ReactNode;
  className?: string;
  actions?: ReactNode;
}) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border border-line-strong bg-surface shadow-[0_30px_80px_-30px] shadow-black/70 ring-1 ring-sky/5 ${className}`}
    >
      <div className="flex items-center gap-3 border-b border-line bg-elevated/40 px-4 py-2.5">
        <div className="flex gap-1.5" aria-hidden="true">
          <span className="size-2.5 rounded-full bg-white/15" />
          <span className="size-2.5 rounded-full bg-white/15" />
          <span className="size-2.5 rounded-full bg-white/15" />
        </div>
        <span className="truncate font-mono text-xs text-muted">{title}</span>
        <div className="ml-auto">{actions}</div>
      </div>
      {children}
    </div>
  );
}
