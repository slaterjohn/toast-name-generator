/** A restrained typographic rule with a central lozenge. Purely decorative. */
export function Ornament({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 16"
      className={className}
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke="currentColor"
    >
      <line x1="4" y1="8" x2="84" y2="8" strokeWidth="1" />
      <line x1="116" y1="8" x2="196" y2="8" strokeWidth="1" />
      <circle cx="90" cy="8" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="110" cy="8" r="1.6" fill="currentColor" stroke="none" />
      <path d="M100 1.5 L106.5 8 L100 14.5 L93.5 8 Z" strokeWidth="1.2" />
      <path d="M100 5 L103 8 L100 11 L97 8 Z" fill="currentColor" stroke="none" />
    </svg>
  );
}
