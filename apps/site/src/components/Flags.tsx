// Simplified flag icons (inline SVG: no external requests).

import type { ReactNode } from "react";

export function FlagBR({ className = "h-4 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 30 21" className={className} aria-hidden="true">
      <rect width="30" height="21" rx="2.5" fill="#009C3B" />
      <path d="M15 2.6 27 10.5 15 18.4 3 10.5Z" fill="#FFDF00" />
      <circle cx="15" cy="10.5" r="4.6" fill="#002776" />
      <path d="M10.6 9.6c3-.9 6.2-.6 8.8.9" fill="none" stroke="#fff" strokeWidth="0.9" />
    </svg>
  );
}

export function FlagUS({ className = "h-4 w-6" }: { className?: string }) {
  const stripes = Array.from({ length: 7 }, (_, i) => i * 3);
  return (
    <svg viewBox="0 0 30 21" className={className} aria-hidden="true">
      <clipPath id="us-clip">
        <rect width="30" height="21" rx="2.5" />
      </clipPath>
      <g clipPath="url(#us-clip)">
        <rect width="30" height="21" fill="#fff" />
        {stripes.map((y) => (
          <rect key={y} y={y} width="30" height="1.6" fill="#B22234" />
        ))}
        <rect width="13" height="11.2" fill="#3C3B6E" />
        {[2.2, 5.6, 9].map((cy) =>
          [2.2, 6.5, 10.8].map((cx) => (
            <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="0.8" fill="#fff" />
          )),
        )}
      </g>
    </svg>
  );
}

/** Rounded flag frame: clips the stripes to the same shape as the other flags. */
function Frame({
  id,
  className,
  children,
}: {
  id: string;
  className: string;
  children: ReactNode;
}) {
  return (
    <svg viewBox="0 0 30 21" className={className} aria-hidden="true">
      <clipPath id={`${id}-clip`}>
        <rect width="30" height="21" rx="2.5" />
      </clipPath>
      <g clipPath={`url(#${id}-clip)`}>{children}</g>
    </svg>
  );
}

export function FlagPT({ className = "h-4 w-6" }: { className?: string }) {
  return (
    <Frame id="pt" className={className}>
      <rect width="30" height="21" fill="#DA291C" />
      <rect width="12" height="21" fill="#046A38" />
      <circle cx="12" cy="10.5" r="4" fill="#FFE900" />
      <circle cx="12" cy="10.5" r="2.4" fill="#DA291C" />
    </Frame>
  );
}

export function FlagAR({ className = "h-4 w-6" }: { className?: string }) {
  return (
    <Frame id="ar" className={className}>
      <rect width="30" height="21" fill="#74ACDF" />
      <rect y="7" width="30" height="7" fill="#fff" />
      <circle cx="15" cy="10.5" r="2.1" fill="#F6B40E" />
    </Frame>
  );
}

export function FlagMX({ className = "h-4 w-6" }: { className?: string }) {
  return (
    <Frame id="mx" className={className}>
      <rect width="30" height="21" fill="#fff" />
      <rect width="10" height="21" fill="#006847" />
      <rect x="20" width="10" height="21" fill="#CE1126" />
      <circle cx="15" cy="10.5" r="2.3" fill="none" stroke="#8C5A2B" strokeWidth="1" />
    </Frame>
  );
}

export function FlagCL({ className = "h-4 w-6" }: { className?: string }) {
  return (
    <Frame id="cl" className={className}>
      <rect width="30" height="21" fill="#D52B1E" />
      <rect width="30" height="10.5" fill="#fff" />
      <rect width="10.5" height="10.5" fill="#0039A6" />
      <polygon
        points="5.25,2.25 5.96,4.28 8.1,4.32 6.39,5.62 7.01,7.68 5.25,6.45 3.49,7.68 4.11,5.62 2.4,4.32 4.55,4.28"
        fill="#fff"
      />
    </Frame>
  );
}

export function FlagWorld({ className = "size-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3Z" />
    </svg>
  );
}
