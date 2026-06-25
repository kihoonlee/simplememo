// Inline SVG icons (Lucide-style, 24x24, currentColor stroke) so we never ship
// emojis as UI icons (they render differently per platform/OS).

type IconProps = { className?: string; style?: React.CSSProperties };

function Stroke({
  className,
  style,
  children,
}: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export const PlusIcon = ({ className }: IconProps) => (
  <Stroke className={className}>
    <path d="M12 5v14M5 12h14" />
  </Stroke>
);

export const SearchIcon = ({ className }: IconProps) => (
  <Stroke className={className}>
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" />
  </Stroke>
);

export const FolderIcon = ({ className }: IconProps) => (
  <Stroke className={className}>
    <path d="M3 7a2 2 0 0 1 2-2h4l2 2.5h8a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
  </Stroke>
);

export const HashIcon = ({ className }: IconProps) => (
  <Stroke className={className}>
    <path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18" />
  </Stroke>
);

export const ExternalLinkIcon = ({ className }: IconProps) => (
  <Stroke className={className}>
    <path d="M15 3h6v6M10 14 21 3M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5" />
  </Stroke>
);

export const TrashIcon = ({ className }: IconProps) => (
  <Stroke className={className}>
    <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M10 11v6M14 11v6" />
  </Stroke>
);

export const ArrowLeftIcon = ({ className }: IconProps) => (
  <Stroke className={className}>
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </Stroke>
);

export const LogOutIcon = ({ className }: IconProps) => (
  <Stroke className={className}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
  </Stroke>
);

export const NoteIcon = ({ className }: IconProps) => (
  <Stroke className={className}>
    <path d="M4 4a2 2 0 0 1 2-2h8l6 6v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
    <path d="M14 2v6h6M8 13h8M8 17h5" />
  </Stroke>
);

export const SpinnerIcon = ({ className, style }: IconProps) => (
  <Stroke className={className} style={style}>
    <path d="M12 3a9 9 0 1 0 9 9" />
  </Stroke>
);

// Google's 4-color "G" (official brand mark). Filled, not stroked.
export const GoogleIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path
      fill="#4285F4"
      d="M23.52 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.87z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.96-1.08 7.95-2.91l-3.88-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.27v3.09A12 12 0 0 0 12 24z"
    />
    <path
      fill="#FBBC05"
      d="M5.27 14.29a7.21 7.21 0 0 1 0-4.58V6.62H1.27a12 12 0 0 0 0 10.76z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.43-3.43A11.96 11.96 0 0 0 12 0 12 12 0 0 0 1.27 6.62l4 3.09C6.22 6.86 8.87 4.75 12 4.75z"
    />
  </svg>
);
