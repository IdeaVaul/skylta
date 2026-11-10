export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <rect x="2" y="2" width="36" height="36" rx="10" fill="#0B6B4A" />
      <path d="M10 12h20" stroke="#FFD23F" strokeWidth="3" strokeLinecap="round" />
      <path d="M15 12v5M25 12v5" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
      <rect x="11" y="17" width="18" height="12" rx="3" fill="#fff" />
    </svg>
  );
}

export function Logo({ size = 36 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark size={size} />
      <span className="font-display text-2xl font-extrabold tracking-tight">skylta</span>
    </span>
  );
}
