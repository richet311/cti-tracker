interface Props {
  size?: number;
  color?: string;
}

export function BrandMark({ size = 20, color = "#60a5fa" }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 2.5L20 6.5V13.5C20 17.6 16.5 21.3 12 22.5C7.5 21.3 4 17.6 4 13.5V6.5L12 2.5Z"
        stroke={color}
        strokeWidth="1.4"
        strokeLinejoin="round"
        fill={`${color}14`}
      />
      <circle cx="12" cy="13" r="2" fill={color} />
      <line x1="12" y1="8.5" x2="12" y2="11" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
      <line x1="12" y1="15" x2="12" y2="17.5" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
      <line x1="7.5" y1="13" x2="10" y2="13" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
      <line x1="14" y1="13" x2="16.5" y2="13" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}
