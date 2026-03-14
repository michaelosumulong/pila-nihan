import React from "react";
import pilaLogo from "@/assets/pila-logo.png";

interface PilaLogoProps {
  className?: string;
  variant?: "full" | "icon";
  style?: React.CSSProperties;
  showGradient?: boolean;
}

const PilaLogo = ({ className = "w-14 h-14", variant = "icon", style, showGradient = false }: PilaLogoProps) => {
  if (showGradient) {
    return (
      <div
        className={`inline-flex items-center justify-center rounded-2xl ${className}`}
        style={{
          background: "linear-gradient(135deg, hsl(220,100%,13%) 0%, hsl(213,70%,38%) 50%, hsl(217,91%,60%) 100%)",
          padding: "12px",
          boxShadow: "0 4px 12px rgba(10, 37, 105, 0.3)",
          ...style,
        }}
      >
        <img
          src={pilaLogo}
          alt="Pila-nihan logo"
          className="w-full h-full object-contain"
          style={{ filter: "none" }}
        />
      </div>
    );
  }

  return (
    <img
      src={pilaLogo}
      alt="Pila-nihan logo"
      className={className}
      style={{ ...style, filter: "none" }}
    />
  );
};

export default PilaLogo;
