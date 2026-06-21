interface Props {
  size?: number;
  color?: string;
}

export function BrandMark({ size = 20, color = "#60a5fa" }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      {/* Corner brackets — tactical viewfinder frame */}
      <path d="M5 9.5 L5 5 L9.5 5"   stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14.5 5 L19 5 L19 9.5" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 14.5 L5 19 L9.5 19"  stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14.5 19 L19 19 L19 14.5" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      {/* Targeting ring */}
      <circle cx="12" cy="12" r="3.6" stroke={color} strokeWidth="1.1" fill={`${color}18`} />
      {/* Center dot */}
      <circle cx="12" cy="12" r="1.7" fill={color} />
    </svg>
  );
}
