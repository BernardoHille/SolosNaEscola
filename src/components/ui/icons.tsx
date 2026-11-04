/** Ícones de linha (24×24, traço 1,8) usados na interface da visita. */
type IconProps = { className?: string };

const base = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export function EntranceIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0C18.5 15.4 12 21 12 21Z" />
      <circle cx="12" cy="10" r="2.3" />
    </svg>
  );
}

export function HelpIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.6 9.3a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.2-2.4 3.6" />
      <circle cx="12" cy="17.2" r="0.6" fill="currentColor" />
    </svg>
  );
}

export function FullscreenIcon({ className, active }: IconProps & { active?: boolean }) {
  return (
    <svg {...base} className={className}>
      {active ? (
        <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" />
      ) : (
        <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
      )}
    </svg>
  );
}

export function QualityIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M4.2 17.5a8.5 8.5 0 1 1 15.6 0" />
      <path d="m12 14 3.6-4.2" />
      <circle cx="12" cy="14" r="1.3" fill="currentColor" />
    </svg>
  );
}

export function CheckIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  );
}

export function CloseIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

export function ChevronLeftIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="m14.5 6-6 6 6 6" />
    </svg>
  );
}

export function ChevronRightIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="m9.5 6 6 6-6 6" />
    </svg>
  );
}

export function ResetViewIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3" />
      <path d="M4.5 4.5v3.8h3.8" />
    </svg>
  );
}

export function ZoomInIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M11 8.2v5.6M8.2 11h5.6M16 16l4 4" />
    </svg>
  );
}

export function ZoomOutIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M8.2 11h5.6M16 16l4 4" />
    </svg>
  );
}

/** Caixa aberta (tirar o conteúdo da caixa / devolver). */
export function BoxIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M3.5 9.5 12 13l8.5-3.5" />
      <path d="M3.5 9.5V17l8.5 3.5 8.5-3.5V9.5" />
      <path d="M12 13v7.5" />
      <path d="m3.5 9.5 3-4.5 8.5 3.5-3 4.5" />
      <path d="m20.5 9.5-3-4.5-8.5 3.5" />
    </svg>
  );
}

export function LayersIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="m12 4 8.5 4.5L12 13 3.5 8.5 12 4Z" />
      <path d="m3.5 12.5 8.5 4.5 8.5-4.5" />
      <path d="m3.5 16.5 8.5 4.5 8.5-4.5" />
    </svg>
  );
}
