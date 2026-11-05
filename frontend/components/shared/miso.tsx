/** Miso, the CampusOS cat. Simple one-style line mark. Allowed on login, empty, onboarding, offline
 *  and friendly success only (never in tables, fees, marks, audit or critical errors). */
export function Miso({ size = 72, className }: { size?: number; className?: string }) {
  return (
    <svg
      role="img"
      aria-label="Miso, the CampusOS cat"
      width={size}
      height={size}
      viewBox="0 0 96 96"
      fill="none"
      className={className}
    >
      <path d="M18 46 14 16l22 12c8-3 16-3 24 0l22-12-4 30c3 6 4 12 4 18 0 16-17 26-34 26S14 80 14 64c0-6 1-12 4-18Z" fill="#111827" />
      <path d="M26 30l-3-9 10 6-7 3Zm44 0 3-9-10 6 7 3Z" fill="#C4B5FD" />
      <ellipse cx="36" cy="55" rx="4.5" ry="5.5" fill="#F5F3EF" />
      <ellipse cx="60" cy="55" rx="4.5" ry="5.5" fill="#F5F3EF" />
      <ellipse cx="37" cy="56" rx="1.6" ry="3.2" fill="#111827" />
      <ellipse cx="61" cy="56" rx="1.6" ry="3.2" fill="#111827" />
      <path d="M44 66h8l-4 4-4-4Z" fill="#C4B5FD" />
      <path d="M48 70v3m0 0c-2 2.5-5 2.5-7 .5m7-.5c2 2.5 5 2.5 7 .5" stroke="#F5F3EF" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
