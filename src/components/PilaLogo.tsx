import pilaLogo from "@/assets/pila-logo.png";

interface PilaLogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
  showGradient?: boolean;
}

const PilaLogo = ({ size = 60, className = "", showText = false, showGradient = false }: PilaLogoProps) => {
  return (
    <div
      className={`inline-flex items-center justify-center ${showGradient ? 'rounded-2xl' : ''} ${className}`}
      style={showGradient ? {
        backgroundColor: '#0A2569',
        padding: size > 100 ? '20px' : size > 50 ? '12px' : '8px',
      } : undefined}
    >
      <img
        src={pilaLogo}
        alt="Pila-Nihan"
        width={size}
        height={size}
        className="object-contain"
      />
      {showText && (
        <div className="ml-3 flex flex-col">
          <span className="text-xl font-bold tracking-tight text-primary leading-none">PILA-NIHAN™</span>
          <span className="text-[10px] italic text-primary/80 leading-tight">Ginhawa sa Bawat Pila</span>
        </div>
      )}
    </div>
  );
};

export default PilaLogo;
