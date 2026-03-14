import React from "react";

interface PilaLogoProps {
  className?: string;
  variant?: "full" | "icon";
  style?: React.CSSProperties;
}

const PilaLogo = ({ className = "w-10 h-10", variant = "icon", style }: PilaLogoProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 100 100"
    className={className}
    style={style}
    aria-label="Pila-nihan logo"
  >
    {/* Philippine sun rays (subtle, behind ticket) */}
    {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
      <line
        key={angle}
        x1="50"
        y1="50"
        x2={50 + 48 * Math.cos((angle * Math.PI) / 180)}
        y2={50 + 48 * Math.sin((angle * Math.PI) / 180)}
        stroke="#FFD700"
        strokeWidth="1.5"
        opacity="0.25"
      />
    ))}

    {/* Ticket shape - lighter blue */}
    <rect
      x="12"
      y="22"
      width="76"
      height="56"
      rx="10"
      fill="none"
      stroke="#60A5FA"
      strokeWidth="3.5"
    />
    {/* Ticket notches */}
    <circle cx="12" cy="43" r="5.5" fill="hsl(220,100%,13%)" stroke="#60A5FA" strokeWidth="3.5" />
    <circle cx="88" cy="43" r="5.5" fill="hsl(220,100%,13%)" stroke="#60A5FA" strokeWidth="3.5" />
    {/* Dashed perforation line */}
    <line
      x1="24"
      y1="43"
      x2="76"
      y2="43"
      stroke="#60A5FA"
      strokeWidth="1.2"
      strokeDasharray="4 3"
      opacity="0.25"
    />
    {/* Stylized "P" - white for contrast */}
    <path
      d="M33,51 L33,76 M33,51 C33,51 33,47 39,45 C45,43 53,45 53,51 C53,57 45,59 39,57 C33,55 33,51 33,51"
      stroke="#FFFFFF"
      strokeWidth="4.5"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Pulse/heartbeat line - golden */}
    <path
      d="M57,63 L61,63 L64,55 L67,71 L70,59 L73,63 L77,63"
      stroke="#FFD700"
      strokeWidth="2.5"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Three-star accent (Philippine flag inspired) */}
    <circle cx="50" cy="30" r="2.2" fill="#FFD700" />
    <circle cx="42" cy="33" r="1.5" fill="#FFD700" opacity="0.7" />
    <circle cx="58" cy="33" r="1.5" fill="#FFD700" opacity="0.7" />
  </svg>
);

export default PilaLogo;
