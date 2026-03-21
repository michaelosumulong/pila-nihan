import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { BRAND_PRESETS } from "@/pages/Settings";

export type BrandPreset = typeof BRAND_PRESETS[number];

interface BrandingContextType {
  branding: BrandPreset;
  customLogo: string | null;
  businessName: string;
  refreshBranding: () => void;
}

const DEFAULT_BRANDING = BRAND_PRESETS[0];

const loadBrandingFromStorage = () => {
  try {
    const raw = localStorage.getItem("pila-merchant");
    if (!raw) return { branding: DEFAULT_BRANDING, customLogo: null, businessName: "Pila-nihan" };
    const parsed = JSON.parse(raw);
    return {
      branding: parsed.branding || DEFAULT_BRANDING,
      customLogo: parsed.customLogo || null,
      businessName: parsed.businessName || "Pila-nihan",
    };
  } catch {
    return { branding: DEFAULT_BRANDING, customLogo: null, businessName: "Pila-nihan" };
  }
};

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

export const BrandingProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState(loadBrandingFromStorage);

  const refreshBranding = useCallback(() => {
    setState(loadBrandingFromStorage());
  }, []);

  useEffect(() => {
    const handler = () => refreshBranding();
    window.addEventListener("merchant-updated", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("merchant-updated", handler);
      window.removeEventListener("storage", handler);
    };
  }, [refreshBranding]);

  return (
    <BrandingContext.Provider
      value={{
        ...state,
        refreshBranding,
      }}
    >
      {children}
    </BrandingContext.Provider>
  );
};

export const useBranding = (): BrandingContextType => {
  const context = useContext(BrandingContext);
  if (!context) {
    const fallback = loadBrandingFromStorage();
    return { ...fallback, refreshBranding: () => {} };
  }
  return context;
};
