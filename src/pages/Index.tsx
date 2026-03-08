import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const BUNTING_COUNT = 24;

const Index = () => {
  const navigate = useNavigate();
  const [shopCode, setShopCode] = useState("");
  const [isValid, setIsValid] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ready, setReady] = useState(false);
  const [existingTicket, setExistingTicket] = useState<any>(null);

  useEffect(() => {
    const merchantData = localStorage.getItem("pila-merchant");
    if (merchantData) {
      try {
        const merchant = JSON.parse(merchantData);
        toast.info(`Welcome back, ${merchant.businessName}!`);
        navigate("/dashboard");
        return;
      } catch { /* show landing */ }
    }

    // Check for active ticket recovery
    const activeTicket = localStorage.getItem("pila-active-ticket");
    if (activeTicket) {
      try {
        const ticketData = JSON.parse(activeTicket);
        const tickets = JSON.parse(localStorage.getItem("tickets") || "[]");
        const current = tickets.find((t: any) => t.ticketNumber === ticketData.ticketNumber);
        if (current && (current.status === "waiting" || current.status === "called")) {
          setExistingTicket(ticketData);
        } else {
          localStorage.removeItem("pila-active-ticket");
        }
      } catch {
        localStorage.removeItem("pila-active-ticket");
      }
    }

    setReady(true);
  }, [navigate]);

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // SANITIZE: Remove all non-alphanumeric, convert to uppercase
    const cleaned = e.target.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    const limited = cleaned.substring(0, 10);
    setShopCode(limited);
    setIsValid(limited.length >= 3);
  };

  const verifyMerchantExists = (code: string): boolean => {
    const merchant = JSON.parse(localStorage.getItem("pila-merchant") || "{}");
    const merchantCode = merchant.shopCode?.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (merchantCode === code) return true;
    const demoMerchants = ["pilani", "demo", "pilanihan"];
    return demoMerchants.includes(code);
  };

  const handleEnterQueue = () => {
    if (!isValid) {
      toast.error("Invalid shop code", {
        description: "Shop code must be at least 3 characters",
      });
      return;
    }
    setIsProcessing(true);
    const finalCode = shopCode.toLowerCase();
    if (verifyMerchantExists(finalCode)) {
      toast.success("Redirecting to queue...");
      navigate(`/join/${finalCode}`);
    } else {
      toast.error("Shop not found", {
        description: "Please check the code and try again. No dashes or spaces needed.",
        duration: 5000,
      });
      setIsProcessing(false);
    }
  };

  const handleSwitchToGuest = () => {
    if (confirm("Log out of merchant account to join queue as customer?")) {
      localStorage.removeItem("pila-merchant");
      toast.info("Switched to Guest Mode");
      window.location.reload();
    }
  };

  if (!ready) return null;

  // Format for DISPLAY only (with dash after 3rd char)
  const displayCode = shopCode.length > 3
    ? `${shopCode.slice(0, 3)}-${shopCode.slice(3)}`
    : shopCode;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[hsl(220,100%,13%)] via-[hsl(213,70%,38%)] to-[hsl(217,91%,60%)] px-4 sm:px-6 py-6 sm:py-12 flex flex-col">
      {/* Bunting */}
      <div className="bunting mb-4">
        {Array.from({ length: BUNTING_COUNT }).map((_, i) => (
          <div key={i} className="bunting-triangle" />
        ))}
      </div>

      {/* Header */}
      <div className="text-center mb-8 sm:mb-16">
        <div className="text-8xl mb-6" style={{ filter: "drop-shadow(0 0 30px rgba(255,255,255,0.6))" }}>
          🎫
        </div>
        <h1 className="text-4xl sm:text-6xl font-bold text-white mb-3 tracking-tight">
          PILA-NIHAN™
        </h1>
        <p className="text-xl sm:text-3xl text-primary italic font-light">
          Ginhawa sa Bawat Pila
        </p>
      </div>

      {/* Ticket Recovery Banner */}
      {existingTicket && (
        <div className="max-w-5xl w-full mx-auto mb-6">
          <div className="bg-primary border-4 border-[hsl(220,100%,13%)] rounded-2xl p-6 shadow-2xl animate-pulse">
            <div className="flex items-start gap-4">
              <span className="text-5xl">🎫</span>
              <div className="flex-1">
                <p className="font-bold text-[hsl(220,100%,13%)] text-xl mb-2">
                  Welcome back, {existingTicket.customerName}!
                </p>
                <p className="text-foreground/80 mb-4">
                  You have an active ticket in the queue
                </p>
                <button
                  onClick={() => navigate(`/ticket/${existingTicket.ticketNumber}?recovered=true`)}
                  className="w-full bg-[hsl(220,100%,13%)] hover:bg-secondary text-white py-4 rounded-xl font-bold text-lg shadow-lg transition-all"
                >
                  🎫 View Ticket #{existingTicket.ticketNumber}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Two-Section Layout */}
      <div className="flex-1 max-w-5xl w-full mx-auto grid grid-cols-1 md:grid-cols-[3fr_2fr] gap-6 mb-8">
        {/* SECTION 1 - Customer Entry */}
        <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-10 hover:shadow-[0_25px_60px_-12px_rgba(0,0,0,0.35)] transition-all duration-300">
          <div className="text-center">
            <div className="text-7xl mb-4">🎫</div>
            <h2 className="text-3xl sm:text-4xl font-bold text-[hsl(220,100%,13%)] mb-3">
              Kumuha ng Ticket
            </h2>
            <p className="text-base sm:text-lg text-gray-700 mb-8">
              Pumila nang maayos, walang singitan!
            </p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">
              Shop Code
            </label>
            <input
              type="text"
              value={displayCode}
              onChange={handleCodeChange}
              placeholder="e.g., PILANI"
              maxLength={12}
              disabled={isProcessing}
              inputMode="text"
              autoCapitalize="characters"
              autoComplete="off"
              className="w-full text-3xl text-center font-mono font-bold uppercase py-4 px-6 rounded-xl border-[3px] border-gray-300 focus:border-primary focus:ring-4 focus:ring-yellow-200 outline-none tracking-widest transition-colors text-gray-900 disabled:opacity-50"
            />
          </div>

          <button
            onClick={handleEnterQueue}
            disabled={!isValid}
            className="w-full bg-primary text-primary-foreground py-5 text-xl sm:text-2xl font-bold rounded-xl shadow-lg hover:brightness-90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            PUMILA NA!
          </button>

          <p className="text-xs text-gray-500 mt-2 text-center">
            No dashes or spaces needed — we'll format it for you!
          </p>

          <div className="text-center mt-4">
            <p className="text-sm text-gray-500 mb-1">Walang code?</p>
            <button
              onClick={() => toast.info("Open your phone camera and point it at the QR code at the store entrance.")}
              className="text-secondary font-medium text-sm hover:underline"
              title="Use your phone camera to scan the QR code at the store entrance"
            >
              📱 I-scan ang QR sa harap ng tindahan
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-6 text-center text-xs text-gray-600">
            <div><span className="block text-lg">⚡</span>3-Second Signup</div>
            <div><span className="block text-lg">🆓</span>No App Download</div>
            <div><span className="block text-lg">🔔</span>Get Notified</div>
          </div>
        </div>

        {/* SECTION 2 - Merchant Portal */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-6 h-fit">
          <div className="text-center">
            <div className="text-5xl mb-3">🏪</div>
            <h2 className="text-2xl font-bold text-[hsl(220,100%,13%)] mb-2">
              Para sa mga Negosyante
            </h2>
            <p className="text-sm text-gray-600 mb-6">Manage your queue system</p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <button
              onClick={() => navigate("/signup")}
              className="bg-secondary text-white py-3 px-4 rounded-lg font-bold text-center hover:brightness-90 transition-all"
            >
              Mag-register
            </button>
            <button
              onClick={() => navigate("/login")}
              className="bg-white border-2 border-secondary text-secondary py-3 px-4 rounded-lg font-bold text-center hover:bg-blue-50 transition-colors"
            >
              Mag-login
            </button>
          </div>

          <div className="text-center mt-4">
            <p className="text-xs text-gray-500">Using merchant device as customer?</p>
            <button
              onClick={handleSwitchToGuest}
              className="text-secondary text-xs font-medium hover:underline"
              title="Log out of merchant account to join queue as customer"
            >
              Switch to Guest Mode
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-3xl mx-auto w-full mb-4">
        <div className="bg-[hsl(var(--warning-bg))] border-l-4 border-destructive p-4 rounded-lg shadow-md flex gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <p className="text-sm font-bold text-gray-900">
              BAWAL ANG FIXER AT UNDER-THE-TABLE!
            </p>
            <p className="text-xs text-gray-700 mt-1">
              Lahat ng bayad ay digital. Walang cash transaction sa pila.
            </p>
          </div>
        </div>
        <p className="text-xs text-white/70 text-center mt-4">Powered by Pila-nihan™</p>
      </div>
    </div>
  );
};

export default Index;
