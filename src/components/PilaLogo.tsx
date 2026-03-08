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
    {/* Ticket shape */}
    <rect
      x="10"
      y="20"
      width="80"
      height="60"
      rx="10"
      fill="none"
      stroke="#1E3A8A"
      strokeWidth="4"
    />
    {/* Ticket notches */}
    <circle cx="10" cy="42" r="6" fill="white" stroke="#1E3A8A" strokeWidth="4" />
    <circle cx="90" cy="42" r="6" fill="white" stroke="#1E3A8A" strokeWidth="4" />
    {/* Dashed perforation line */}
    <line
      x1="22"
      y1="42"
      x2="78"
      y2="42"
      stroke="#1E3A8A"
      strokeWidth="1.5"
      strokeDasharray="4 3"
      opacity="0.3"
    />
    {/* Stylized "P" */}
    <path
      d="M32,50 L32,78 M32,50 C32,50 32,46 38,44 C44,42 52,44 52,50 C52,56 44,58 38,56 C32,54 32,50 32,50"
      stroke="#1E3A8A"
      strokeWidth="5"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Pulse/heartbeat line accent */}
    <path
      d="M56,62 L60,62 L63,54 L66,70 L69,58 L72,62 L76,62"
      stroke="#FFB703"
      strokeWidth="3"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Small golden star accent */}
    <circle cx="64" cy="30" r="3" fill="#FFB703" />
  </svg>
);

export default PilaLogo;
