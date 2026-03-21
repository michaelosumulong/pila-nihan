import { useEffect, useState } from "react";

const FoundingMerchantBadge = () => {
  const [number, setNumber] = useState<number | null>(null);

  useEffect(() => {
    const merchant = localStorage.getItem("pila-merchant");
    if (!merchant) return;

    const parsed = JSON.parse(merchant);
    if (!parsed.foundingNumber) {
      const existing = parseInt(localStorage.getItem("pila-founding-count") || "0", 10);
      const num = existing + 1;
      localStorage.setItem("pila-founding-count", String(num));
      parsed.foundingNumber = num;
      localStorage.setItem("pila-merchant", JSON.stringify(parsed));
    }
    setNumber(parsed.foundingNumber);
  }, []);

  if (!number) return null;

  return (
    <div className="bg-gradient-to-r from-yellow-100 via-yellow-50 to-yellow-100 border-2 border-primary/40 rounded-2xl p-4 flex items-center gap-4">
      <div className="flex-shrink-0 w-14 h-14 bg-primary rounded-full flex items-center justify-center shadow-lg">
        <span className="text-primary-foreground font-bold text-lg">⭐</span>
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-gray-900">Founding Merchant</span>
          <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full">
            #{number} of 50
          </span>
        </div>
        <p className="text-xs text-gray-600 mt-0.5">
          2 months free + lifetime 20% discount
        </p>
      </div>
      <span className="text-2xl">🇵🇭</span>
    </div>
  );
};

export default FoundingMerchantBadge;
