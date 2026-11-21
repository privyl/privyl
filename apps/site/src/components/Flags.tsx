// Simplified flag icons (inline SVG: no external requests).

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
