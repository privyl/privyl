// Placeholder logo until the final design is ready.
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 font-medium tracking-tight ${className}`}>
      <svg viewBox="0 0 32 32" className="size-6" aria-hidden="true">
        <rect width="32" height="32" rx="8" fill="#03203D" />
        <rect
          x="0.5"
          y="0.5"
          width="31"
          height="31"
          rx="7.5"
          fill="none"
          stroke="#639CC5"
          strokeOpacity="0.35"
        />
        <path
          d="M11 23V9h6a4.5 4.5 0 0 1 0 9h-6"
          fill="none"
          stroke="#639CC5"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="22.5" cy="22.5" r="1.8" fill="#EB2F33" />
      </svg>
      Privyl
    </span>
  );
}
