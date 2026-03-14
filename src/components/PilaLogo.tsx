interface PilaLogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
  showGradient?: boolean;
}

const PilaLogo = ({ size = 60, className = "", showText = true }: PilaLogoProps) => {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        <rect
          x="15"
          y="25"
          width="70"
          height="50"
          rx="8"
          stroke="white"
          strokeWidth="2"
          strokeDasharray="4 2"
          fill="white"
          fillOpacity="0.05"
        />

        <circle cx="50" cy="50" r="12" fill="#FFB703" />

        <g stroke="#FFB703" strokeWidth="2.5" strokeLinecap="round">
          <line x1="50" y1="32" x2="50" y2="38" />
          <line x1="50" y1="62" x2="50" y2="68" />
          <line x1="32" y1="50" x2="38" y2="50" />
          <line x1="62" y1="50" x2="68" y2="50" />
          <line x1="38" y1="38" x2="42" y2="42" />
          <line x1="58" y1="58" x2="62" y2="62" />
          <line x1="38" y1="62" x2="42" y2="58" />
          <line x1="58" y1="42" x2="62" y2="38" />
        </g>

        <path d="M50 18 L51.5 22 L56 22 L52.5 25 L54 29 L50 26 L46 29 L47.5 25 L44 22 L48.5 22 Z" fill="#FCD116" />

        <path d="M25 65 L26.5 69 L31 69 L27.5 72 L29 76 L25 73 L21 76 L22.5 72 L19 69 L23.5 69 Z" fill="#FCD116" />

        <path d="M75 65 L76.5 69 L81 69 L77.5 72 L79 76 L75 73 L71 76 L72.5 72 L69 69 L73.5 69 Z" fill="#FCD116" />

        <circle cx="25" cy="45" r="5" fill="white" opacity="0.9" />
        <path
          d="M20 58 C20 52 22 50 25 50 C28 50 30 52 30 58"
          stroke="white"
          strokeWidth="2"
          fill="none"
          opacity="0.9"
        />
      </svg>

      {showText && (
        <div className="ml-3 flex flex-col">
          <span className="text-xl font-bold tracking-tight text-[#FFB703] leading-none">PILA-NIHAN™</span>
          <span className="text-[10px] italic text-[#FDFBD4] opacity-90 leading-tight">Ginhawa sa Bawat Pila</span>
        </div>
      )}
    </div>
  );
};

export default PilaLogo;
