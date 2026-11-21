// Small shared UI pieces: icons and button links, so every arrow and button looks the same.

import Link from "next/link";
import type { ReactNode } from "react";

type IconProps = { className?: string };

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

/** Arrow for internal links ("go to"). Slides right on hover (see .arrow in globals.css). */
export function ArrowRight({ className = "size-4" }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" className={`arrow arrow-right ${className}`} aria-hidden="true">
      <path d="M3 8h9.5M8.5 4l4 4-4 4" {...stroke} />
    </svg>
  );
}

/** Arrow for links that open another site. Slides up-right on hover. */
export function ArrowUpRight({ className = "size-3.5" }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" className={`arrow arrow-up-right ${className}`} aria-hidden="true">
      <path d="M5 11 11 5M6 5h5v5" {...stroke} />
    </svg>
  );
}

export function CheckIcon({ className = "size-4" }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden="true">
      <path d="m3.5 8.5 3 3 6-7" {...stroke} />
    </svg>
  );
}

export function CopyIcon({ className = "size-3.5" }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden="true">
      <rect x="5.5" y="5.5" width="8" height="8" rx="1.8" {...stroke} />
      <path
        d="M10.5 3.2A1.8 1.8 0 0 0 9 2.5H4.3a1.8 1.8 0 0 0-1.8 1.8V9a1.8 1.8 0 0 0 .7 1.5"
        {...stroke}
      />
    </svg>
  );
}

export function RefreshIcon({ className = "size-3.5" }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden="true">
      <path d="M13 8a5 5 0 1 1-1.5-3.6M13 2.5v3h-3" {...stroke} />
    </svg>
  );
}

export function ShieldIcon({ className = "size-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M12 3 4 6v6c0 4.4 3.4 8.2 8 9 4.6-.8 8-4.6 8-9V6l-8-3Z" {...stroke} />
      <path d="m9 12 2 2 4-4" {...stroke} />
    </svg>
  );
}

export function LockIcon({ className = "size-4" }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden="true">
      <rect x="3" y="7" width="10" height="7" rx="1.8" {...stroke} />
      <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" {...stroke} />
    </svg>
  );
}

type Variant = "primary" | "secondary";

/** A link that looks like a button. External links open in a new tab with a ↗-style arrow. */
export function ButtonLink({
  href,
  children,
  variant = "secondary",
  size,
  external = false,
  arrow = true,
  className = "",
}: {
  href: string;
  children: ReactNode;
  variant?: Variant;
  size?: "sm";
  external?: boolean;
  arrow?: boolean;
  className?: string;
}) {
  const cls = `btn btn-${variant} ${size === "sm" ? "btn-sm" : ""} ${className}`;
  const icon = arrow ? external ? <ArrowUpRight /> : <ArrowRight /> : null;
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
        {children}
        {icon}
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {children}
      {icon}
    </Link>
  );
}

/** Small rounded label, like "Live" or "0 exposed". */
export function Pill({
  children,
  tone = "muted",
  dot = false,
  className = "",
}: {
  children: ReactNode;
  tone?: "muted" | "sky" | "alert";
  dot?: boolean;
  className?: string;
}) {
  const tones = {
    muted: "border-line-strong bg-white/[0.03] text-muted",
    sky: "border-sky/25 bg-sky/10 text-sky",
    alert: "border-alert/25 bg-alert/10 text-alert-soft",
  };
  const dots = { muted: "bg-muted", sky: "bg-sky", alert: "bg-alert" };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[11px] ${tones[tone]} ${className}`}
    >
      {dot && <span className={`size-1.5 rounded-full ${dots[tone]}`} aria-hidden="true" />}
      {children}
    </span>
  );
}
