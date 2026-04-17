/**
 * EV Charging Station Icon — Zapfsäule mit Steckdose
 * Clean SVG icon modelled after standard EV station signage.
 */
interface EvStationIconProps {
  size?: number;
  className?: string;
  color?: string;
}

export function EvStationIcon({ size = 24, className = "", color = "currentColor" }: EvStationIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      className={className}
      aria-hidden="true"
    >
      {/* Station body / housing */}
      <rect x="3" y="4" width="11" height="15" rx="2" fill={color} opacity="0.9" />

      {/* Display panel inset */}
      <rect x="5" y="6" width="7" height="5" rx="1" fill="white" opacity="0.25" />

      {/* Lightning bolt on display */}
      <path
        d="M9.5 6.5 L7.5 10 L9 10 L8 13 L11 9 L9.5 9 Z"
        fill="white"
        opacity="0.9"
      />

      {/* Charging socket circle (front) */}
      <circle cx="8.5" cy="16" r="1.5" fill="white" opacity="0.55" />

      {/* Cable — horizontal arm */}
      <path
        d="M14 10 Q17 10 17 13"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.85"
      />

      {/* Plug head */}
      <rect x="15.5" y="13" width="3" height="4" rx="1" fill={color} opacity="0.85" />
      {/* Plug prongs */}
      <line x1="16.5" y1="17" x2="16.5" y2="19" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
      <line x1="18.5" y1="17" x2="18.5" y2="19" stroke={color} strokeWidth="1.2" strokeLinecap="round" />

      {/* Base */}
      <rect x="4" y="19" width="9" height="2" rx="1" fill={color} opacity="0.7" />
    </svg>
  );
}
