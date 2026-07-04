import React from "react";
import pilaLogo from "@/assets/pila-logo.png";

interface PilaLogoProps {
  className?: string;
  variant?: "full" | "icon";
  style?: React.CSSProperties;
}

const PilaLogo = ({ className = "w-14 h-14", variant = "icon", style }: PilaLogoProps) => (
  <img
    src={pilaLogo}
    alt="Pilanihan logo"
    className={className}
    style={{ ...style, filter: "none" }}
  />
);

export default PilaLogo;
