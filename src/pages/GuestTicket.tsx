import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { useLowBattery } from "@/hooks/use-low-battery";
import LowBatteryBanner from "@/components/LowBatteryBanner";
import CustomerFeedbackModal from "@/components/CustomerFeedbackModal";
import NotificationCenter from "@/components/NotificationCenter";
import VersionFooter from "@/components/VersionFooter";

const CATEGORY_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  regular: { bg: "bg-gray-100", text: "text-gray-800", label: "Regular" },
  express: { bg: "bg-green-100", text: "text-green-800", label: "Express" },
  priority: { bg: "bg-yellow-100", text: "text-yellow-800", label: "Priority" },
};

const getMessage = (position: number) => {
  if (position <= 0) return "Please proceed to the counter! 🎯";
  if (position === 1) return "You're next! 🎉";
  if (position === 2) return "Almost your turn! 😊";
  if (position <= 5) return "You're in the front section 👍";
  return "Thank you for waiting! ⏳";
};

const ordinal = (n: number) => (n === 1 ? "1st" : n === 2 ? "2nd" : n === 3 ? "3rd" : `${n}th`);

const GuestTicket = () => {
  const { ticketNumber } = useParams();
  const [searchParams] = useSearchParams();
  const isRecovered = searchParams.get("recovered") === "true";
  const { lowBatteryMode, lastRefresh, toggleLowBattery, manualRefresh } = useLowBattery();
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // PWA install prompt
  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        toast.success("Pila-nihan installed!", { description: "Access tickets from your home screen" });
      }
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    }
  };

  const shareTicket = async () => {
    const shareData = {
      title: `Pila-nihan Ticket ${ticketNumber}`,
      text: `I'm #${ticketData.position} in line. Estimated wait: ${ticketData.estimatedWaitMinutes} min.`,
      url: window.location.href,
    };
    if (navigator.share) {
      try { await navigator.share(shareData); toast.success("Ticket shared!"); } catch {}
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Ticket link copied to clipboard!");
    }
  };

  const merchantData = JSON.parse(localStorage.getItem("pila-merchant") || "{}");
  const merchantCategory = merchantData.category || "SULONG";
  const expressPrice = merchantCategory === "AGOS" ? 200 : merchantCategory === "SULONG" ? 100 : 0;
  const vatRate = 0.12;
  const vatAmount = Math.round(expressPrice * vatRate);
  const totalExpressPrice = expressPrice + vatAmount;

  const [qualifiesForSocial, setQualifiesForSocial] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const [ticketData] = useState({
    ticketNumber: ticketNumber || "R-056",
    customerName: "Maria Santos",
    category: "regular",
    position: 2,
    totalInQueue: 10,
    estimatedWaitMinutes: 15,
    nowServing: "R-054",
  });

  const progressValue = ((ticketData.totalInQueue - ticketData.position) / ticketData.totalInQueue) * 100;
  const cat = CATEGORY_STYLES[ticketData.category] || CATEGORY_STYLES.regular;

  const handleUpgrade = (type: "express" | "social_priority") => {
    if (type === "express") {
      toast.success(`Processing Express Upgrade - ₱${totalExpressPrice} (₱${expressPrice} + VAT)`, {
        description: "Redirecting to GCash/Maya payment...",
      });
    } else if (type === "social_priority") {
      if (!qualifiesForSocial) {
        toast.error("Please check the box to confirm you qualify");
        return;
      }
      toast.info("Social Priority Request Submitted", {
        description: "Please show valid ID to staff for verification",
      });
    }
  };

  // Smart auto-refresh based on battery mode
  useEffect(() => {
    const interval = setInterval(() => {
      // Check if ticket has been served for feedback trigger
      const tickets = JSON.parse(localStorage.getItem("tickets") || "[]");
      const current = tickets.find((t: any) => t.ticketNumber === ticketNumber);
      if (current && current.status === "served" && !feedbackSubmitted) {
        setShowFeedback(true);
      }
    }, lowBatteryMode ? 60000 : 10000);
    return () => clearInterval(interval);
  }, [lowBatteryMode, ticketNumber, feedbackSubmitted]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#002366] via-[#1E5AA8] to-[#3B82F6] px-6 py-4 pb-12">
      {/* Battery Toggle Header */}
      <div className="max-w-md mx-auto flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎫</span>
          <div>
            <p className="text-white font-bold text-sm">Your Ticket</p>
            <p className="text-xs text-white/70">
              {lowBatteryMode ? "Battery Saver ON" : "Live Updates"}
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            const newMode = toggleLowBattery();
            if (newMode) {
              toast.success("Battery Saver activated", {
                description: "Auto-update paused. Tap 'Refresh Now' to check manually.",
                duration: 4000,
              });
            } else {
              toast.info("Standard mode restored", {
                description: "Auto-update every 10 seconds enabled",
                duration: 2000,
              });
            }
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
            lowBatteryMode
              ? "bg-green-500 text-white"
              : "bg-white/20 text-white hover:bg-white/30"
          }`}
        >
          🔋
          <span>{lowBatteryMode ? "Saving" : "Save Battery"}</span>
        </button>
      </div>

      {/* Low Battery Banner */}
      {lowBatteryMode && (
        <div className="max-w-md mx-auto">
          <LowBatteryBanner lastRefresh={lastRefresh} onRefresh={manualRefresh} />
        </div>
      )}

      {/* Bunting - hidden in low battery mode */}
      {!lowBatteryMode && (
        <div className="bunting pt-2 pb-1">
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} className="bunting-triangle" />
          ))}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col items-center mt-4 mb-6">
        <div
          className="w-32 h-32 bg-[#3B82F6] rounded-2xl flex items-center justify-center mb-2"
          style={lowBatteryMode ? undefined : { filter: "drop-shadow(0 0 20px rgba(255,255,255,0.5))" }}
        >
          <span className="text-7xl">🎫</span>
        </div>
        <h1 className="text-2xl font-bold text-white">PILA-NIHAN™</h1>
        <p className="text-[#FFD700] italic text-lg">Ginhawa sa Bawat Pila</p>
      </div>

      {/* Ticket Card */}
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md mx-auto mb-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <span className="text-4xl">🎫</span>
        </div>
        <p className="text-2xl font-medium text-gray-700 mb-2">{ticketData.customerName}</p>
        <span className={`${cat.bg} ${cat.text} px-4 py-2 rounded-full text-lg font-semibold inline-block`}>
          {cat.label}
        </span>
      </div>

      {/* Position & Wait Time */}
      <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mb-6">
        <div className="bg-white rounded-2xl shadow-lg p-5 text-center">
          <p className="text-gray-600 text-sm uppercase mb-2">Your Position</p>
          <span className="text-2xl">👥</span>
          <p className="text-4xl font-bold text-[#3B82F6]">{ordinal(ticketData.position)} in line</p>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-5 text-center">
          <p className="text-gray-600 text-sm uppercase mb-2">Estimated Wait</p>
          <p className="text-3xl font-bold text-[#FFD700]">⏱️ {ticketData.estimatedWaitMinutes} min</p>
          <p className="text-xs text-gray-500 mt-1">Based on average service time</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="max-w-md mx-auto mb-6 bg-white rounded-2xl shadow-lg p-5">
        <p className="text-sm text-gray-600 mb-2">Queue Progress</p>
        <Progress value={progressValue} className="h-4 bg-gray-200 [&>div]:bg-[#10B981]" />
        <p className="text-xs text-gray-500 mt-2">
          {ticketData.position} of {ticketData.totalInQueue} in queue
        </p>
      </div>

      {/* Recovery confirmation */}
      {isRecovered && (
        <div className="max-w-md mx-auto mb-4">
          <div className="bg-green-50 border-l-4 border-green-500 p-3 rounded">
            <p className="text-sm text-green-800 flex items-center gap-2">
              <span>✓</span>
              <span>Ticket recovered successfully! You're still in line.</span>
            </p>
          </div>
        </div>
      )}

      {/* Now Serving */}
      <div className="max-w-md mx-auto mb-6 bg-white rounded-2xl shadow-lg p-5 text-center">
        <p className="text-sm text-gray-600 uppercase mb-1">Now Serving:</p>
        <p className="text-2xl font-bold text-[#1E3A8A]">{ticketData.nowServing}</p>
        <p className="text-lg mt-2">{getMessage(ticketData.position)}</p>
      </div>

      {/* Pro Tips & Share */}
      <div className="max-w-md mx-auto mb-6 bg-yellow-50 border-l-4 border-yellow-500 rounded-lg p-4">
        <p className="text-sm text-yellow-800 font-semibold mb-2">💡 Pro Tips to keep your ticket safe:</p>
        <ul className="text-xs text-yellow-700 space-y-1">
          <li>📸 Take a screenshot of this page</li>
          <li>🔖 Bookmark this page in your browser</li>
          <li>📱 Add Pila-nihan to your home screen (works like an app!)</li>
        </ul>
      </div>

      {/* Share Button */}
      <div className="max-w-md mx-auto mb-6">
        <button
          onClick={shareTicket}
          className="w-full bg-white/20 text-white py-3 rounded-xl font-bold border-2 border-white/30 hover:bg-white/30 transition-all"
        >
          📤 Share Ticket Link
        </button>
      </div>

      {/* PWA Install Banner */}
      {showInstallPrompt && (
        <div className="max-w-md mx-auto mb-6 bg-blue-50 border-2 border-blue-500 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <span className="text-3xl">📱</span>
            <div className="flex-1">
              <p className="font-bold text-blue-900 mb-1">Install Pila-nihan</p>
              <p className="text-sm text-blue-800 mb-3">Add to your home screen for quick access!</p>
              <div className="flex gap-2">
                <button onClick={handleInstallClick} className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-bold text-sm">
                  Install Now
                </button>
                <button onClick={() => setShowInstallPrompt(false)} className="px-4 bg-white text-gray-700 py-2 rounded-lg font-bold text-sm border border-gray-300">
                  Later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Options */}
      <div className="max-w-md mx-auto mb-6">
        <h3 className="text-white font-bold text-lg mb-3 text-center">Upgrade Your Spot</h3>
        <div className="grid grid-cols-2 gap-3">
          {/* Express */}
          <div className="bg-white rounded-2xl border-2 border-[#10B981] p-4 text-center">
            <span className="text-3xl">⚡</span>
            <p className="font-bold text-lg mt-1">Express Service</p>
            <p className="text-2xl font-bold text-[#10B981]">₱{expressPrice}</p>
            <p className="text-xs text-gray-600">+ ₱{vatAmount} VAT (12%)</p>
            <p className="text-sm font-bold text-gray-800 mb-2">Total: ₱{totalExpressPrice}</p>
            <ul className="text-xs text-gray-600 my-2 space-y-1 text-left px-1">
              <li>• Faster service (1:2 fairness ratio)</li>
              <li>• Digital payment via GCash/Maya</li>
              <li>• Target wait: ~10 minutes</li>
            </ul>
            <button
              onClick={() => handleUpgrade("express")}
              className="bg-[#10B981] text-white w-full py-3 rounded-lg font-bold"
            >
              Pay ₱{totalExpressPrice} to Upgrade
            </button>
            <p className="text-xs text-gray-500 italic mt-1">Revenue: Merchant 40% | Platform 60%</p>
          </div>

          {/* Social Priority */}
          <div className="bg-white rounded-2xl border-2 border-[#10B981] p-4 text-center">
            <span className="text-3xl">🤝</span>
            <p className="font-bold text-lg mt-1">Social Priority</p>
            <span className="inline-block bg-[#10B981] text-white text-xs px-2 py-1 rounded mb-2">
              LIBRE - SOCIAL SERVICE
            </span>
            <p className="text-3xl font-bold text-[#10B981]">FREE</p>
            <p className="text-sm text-gray-600 italic mb-2">Para sa Seniors, PWD, Buntis</p>
            <ul className="text-xs text-gray-600 my-2 space-y-1 text-left px-1">
              <li>• Always served first</li>
              <li>• No payment required</li>
              <li>• Valid ID for verification</li>
            </ul>
            <div className="flex items-center gap-2 mb-2 justify-center">
              <Checkbox
                id="social-qualify"
                checked={qualifiesForSocial}
                onCheckedChange={(checked) => setQualifiesForSocial(checked === true)}
              />
              <label htmlFor="social-qualify" className="text-sm text-gray-700 cursor-pointer">
                I qualify (Senior/PWD/Pregnant)
              </label>
            </div>
            <button
              onClick={() => handleUpgrade("social_priority")}
              disabled={!qualifiesForSocial}
              className="bg-[#10B981] text-white w-full py-3 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Request Priority
            </button>
          </div>
        </div>

        {/* Anti-Corruption Disclaimer */}
        <div className="bg-[#FEF3C7] border-l-4 border-[#EF4444] p-3 rounded mt-4">
          <p className="text-xs font-bold text-gray-800">
            ⚠️ Bawal ang Fixer! Express payment via GCash/Maya only. Social Priority is FREE with valid ID.
          </p>
        </div>
      </div>

      {/* Report Issue */}
      <div className="max-w-md mx-auto text-center mb-4">
        <button
          onClick={() => toast.info("Contact support: +63 917 PILA-HELP")}
          className="text-sm text-gray-300 underline"
        >
          ⚠️ Report an Issue
        </button>
      </div>

      {/* Auto-refresh indicator */}
      <div className="flex items-center justify-center gap-2 mb-6">
        <span className={`w-2 h-2 rounded-full ${lowBatteryMode ? "bg-yellow-400" : "bg-green-400"}`} />
        <span className="text-xs text-gray-300">
          {lowBatteryMode ? "Updates every 60s • Tap 🔋 for live" : "Updates automatically every 10s"}
        </span>
      </div>

      <VersionFooter />

      {/* Customer Feedback Modal */}
      {showFeedback && !feedbackSubmitted && (
        <CustomerFeedbackModal
          ticketNumber={ticketData.ticketNumber}
          customerName={ticketData.customerName}
          onClose={() => setShowFeedback(false)}
          onSubmitted={() => {
            setFeedbackSubmitted(true);
            setShowFeedback(false);
          }}
        />
      )}
    </div>
  );
};

export default GuestTicket;
