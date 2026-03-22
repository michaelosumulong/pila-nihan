import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { validateBypassCode } from "@/lib/bypass-code";
import { addNotification } from "@/lib/notifications";
import PilaLogo from "@/components/PilaLogo";
import { useBranding } from "@/contexts/BrandingContext";
import { migrateLegacyCategory } from "@/utils/migrateLegacyData";

const validateMobile = (value: string) => {
  const cleaned = value.replace(/\s+/g, "");
  return /^(\+639|09)\d{9}$/.test(cleaned);
};

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/** Express Pass pricing by service pace */
const EXPRESS_PRICING: Record<string, number> = {
  Express: 200,
  Standard: 100,
  Technical: 50,
  // Legacy fallbacks
  AGOS: 200,
  SULONG: 100,
  ALON: 50,
};

const DEMO_MERCHANTS: Record<string, any> = {
  pilani: {
    id: "demo-pilani", businessName: "Pilanihan Demo", shopCode: "PILANI", category: "Express",
    location: { lat: 14.5826, lng: 121.0527 }, address: "Pasig City, Metro Manila",
    ownerName: "Demo Owner", mobile: "09171234567", targetHandlingTime: 5,
  },
  pilanihan: {
    id: "demo-pilanihan", businessName: "Pilanihan", shopCode: "PILANIHAN", category: "Express",
    location: { lat: 14.5826, lng: 121.0527 }, address: "Pasig City, Metro Manila",
    ownerName: "Demo Owner", mobile: "09171234567", targetHandlingTime: 5,
  },
  demo: {
    id: "demo-test", businessName: "Demo Shop", shopCode: "DEMO", category: "Standard",
    location: { lat: 14.5826, lng: 121.0527 }, address: "Pasig City, Metro Manila",
    ownerName: "Test User", mobile: "09171234567", targetHandlingTime: 15,
  },
};

type QueueType = "regular" | "express" | "social";

const GuestEntry = () => {
  const { merchantId } = useParams();
  const navigate = useNavigate();
  const { branding, customLogo, businessName: brandName } = useBranding();
  const buntingCount = 24;

  // --- Merchant discovery ---
  const [merchantData, setMerchantData] = useState<any>(null);
  const [merchantLoading, setMerchantLoading] = useState(true);
  const [merchantError, setMerchantError] = useState(false);

  useEffect(() => {
    const cleanId = merchantId?.toLowerCase().replace(/[^a-z0-9]/g, "") || "";
    if (!cleanId || cleanId === "merchantid") {
      toast.error("Invalid shop link", { description: "Please enter a valid shop code on the home page.", duration: 5000 });
      navigate("/");
      return;
    }
    const stored = JSON.parse(localStorage.getItem("pila-merchant") || "{}");
    const storedCode = stored.shopCode?.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (storedCode === cleanId) {
      setMerchantData(stored);
      setMerchantLoading(false);
    } else if (DEMO_MERCHANTS[cleanId]) {
      setMerchantData(DEMO_MERCHANTS[cleanId]);
      setMerchantLoading(false);
    } else {
      setMerchantError(true);
      setMerchantLoading(false);
      toast.error("Shop not found", { description: `Could not find shop with code: ${merchantId}`, duration: 8000 });
    }
  }, [merchantId]);

  const merchantName = merchantData?.businessName || "Pila-nihan Queue System";
  const merchantLocation = merchantData?.location || { lat: 14.5995, lng: 120.9842 };
  const merchantCategory = migrateLegacyCategory(merchantData?.category || "Standard");
  const businessCategory = merchantData?.businessCategory || "sulong";
  const targetTime = merchantData?.targetHandlingTime || 15;

  // --- Queue type selection (step-based) ---
  const [step, setStep] = useState<"select" | "form">("select");
  const [selectedType, setSelectedType] = useState<QueueType>("regular");

  // --- Form fields ---
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [priorityConfirmed, setPriorityConfirmed] = useState(false);
  const [enablePushNotifications, setEnablePushNotifications] = useState(true);

  // --- Geofencing ---
  const [customerLocation, setCustomerLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [isWithinRange, setIsWithinRange] = useState(false);
  const [locationStatus, setLocationStatus] = useState<"checking" | "within_range" | "too_far" | "error" | "not_supported">("checking");
  const [locationError, setLocationError] = useState("");

  // --- Bypass code ---
  const [showBypass, setShowBypass] = useState(false);
  const [bypassCode, setBypassCode] = useState("");
  const [bypassVerified, setBypassVerified] = useState(false);

  const handleBypassSubmit = () => {
    const seed = merchantData?.id || "pila-nihan";
    if (validateBypassCode(bypassCode, seed)) {
      setBypassVerified(true);
      setIsWithinRange(true);
      setLocationStatus("within_range");
      toast.success("Bypass code accepted! You can now join the queue.");
    } else {
      toast.error("Invalid bypass code. Ask the merchant for today's code.");
    }
  };

  useEffect(() => {
    if (!merchantData) return;
    if (!navigator.geolocation) {
      setLocationStatus("not_supported");
      setLocationError("Your device does not support location services.");
      return;
    }
    const locationTimeout = setTimeout(() => {
      setLocationStatus("error");
      setLocationError("Location request timed out. Use bypass code to continue.");
      toast.warning("Location not available", { description: "Use the bypass code from the merchant to continue", duration: 8000 });
    }, 10000);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        clearTimeout(locationTimeout);
        const custLoc = { lat: position.coords.latitude, lng: position.coords.longitude };
        setCustomerLocation(custLoc);
        const dist = calculateDistance(custLoc.lat, custLoc.lng, merchantLocation.lat, merchantLocation.lng);
        setDistance(dist);
        const GEOFENCE_RADIUS_KM = 20;
        setIsWithinRange(dist <= GEOFENCE_RADIUS_KM);
        setLocationStatus(dist <= GEOFENCE_RADIUS_KM ? "within_range" : "too_far");
      },
      (error) => {
        clearTimeout(locationTimeout);
        let errorMsg = "Location access denied.";
        if (error.code === 1) errorMsg = "Location permission denied. Please enable location in your browser settings.";
        else if (error.code === 2) errorMsg = "Location unavailable. Check your GPS/WiFi connection.";
        else if (error.code === 3) errorMsg = "Location request timed out.";
        setLocationStatus("error");
        setLocationError(errorMsg);
        toast.warning("Location not available", { description: "Use the bypass code from the merchant to continue", duration: 8000 });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
    return () => clearTimeout(locationTimeout);
  }, [merchantData, merchantLocation.lat, merchantLocation.lng]);

  // --- Pricing ---
  const expressPrice = EXPRESS_PRICING[merchantCategory] || 100;
  const canShowExpress = businessCategory !== "lingkod";
  const regularWait = `${targetTime * 3} mins`;
  const expressWait = `${targetTime} mins`;

  // --- Validation ---
  const isFormValid =
    name.trim().length >= 2 &&
    validateMobile(mobile) &&
    (selectedType !== "social" || priorityConfirmed) &&
    isWithinRange &&
    locationStatus === "within_range";

  // --- Submit ---
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) {
      toast.error("Please fill in all required fields correctly.");
      return;
    }
    try {
      const existingTickets = JSON.parse(localStorage.getItem("tickets") || "[]");
      const prefix = selectedType === "regular" ? "R" : "P";
      const sameTypeTickets = existingTickets.filter((t: any) => t.ticketNumber?.startsWith(prefix));
      const nextNumber = String(sameTypeTickets.length + 1).padStart(3, "0");
      const ticketNumber = `${prefix}-${nextNumber}`;
      const waitingTickets = existingTickets.filter((t: any) => t.status === "waiting");

      const isPriority = selectedType === "express" || selectedType === "social";
      const paidAmount = selectedType === "express" ? expressPrice : 0;

      const newTicket = {
        id: `ticket-${Date.now()}`,
        merchant_id: merchantData?.id || merchantId || "default",
        ticketNumber,
        customerName: name.trim(),
        mobile: mobile.trim(),
        category: selectedType === "social" ? "priority" : selectedType,
        queueType: selectedType,
        status: "waiting",
        joined_at: new Date().toISOString(),
        called_at: null,
        serving_started_at: null,
        completed_at: null,
        wait_time_minutes: null,
        handling_time_minutes: null,
        is_social_priority: selectedType === "social",
        priority_reason: selectedType === "social" ? "senior_pwd_pregnant" : null,
        is_express: selectedType === "express",
        paid_amount: paidAmount,
        position: waitingTickets.length + 1,
        totalInQueue: waitingTickets.length + 1,
        estimatedWaitMinutes: isPriority
          ? Math.ceil((waitingTickets.filter((t: any) => t.category === "priority" || t.queueType === "express" || t.queueType === "social").length + 1) * targetTime)
          : (waitingTickets.length + 1) * targetTime,
        nowServing: existingTickets.find((t: any) => t.status === "serving")?.ticketNumber || "N/A",
        customer_location: customerLocation,
        distance_from_merchant: distance,
        push_notifications_enabled: enablePushNotifications,
      };

      existingTickets.push(newTicket);
      localStorage.setItem("tickets", JSON.stringify(existingTickets));

      // Track express revenue
      if (selectedType === "express" && paidAmount > 0) {
        const merchant = JSON.parse(localStorage.getItem("pila-merchant") || "{}");
        merchant.prepaidCredits = (merchant.prepaidCredits || 0) + paidAmount;
        localStorage.setItem("pila-merchant", JSON.stringify(merchant));
      }

      localStorage.setItem("pila-active-ticket", JSON.stringify({
        ticketNumber,
        customerName: name.trim(),
        status: "waiting",
        queueType: selectedType,
        savedAt: new Date().toISOString(),
      }));

      addNotification({
        title: "Ticket Created!",
        message: `You are now in the queue. Position #${waitingTickets.length + 1}.`,
        type: "success",
        ticketNumber,
      });

      const typeLabel =
        selectedType === "express" ? "⚡ Express Pass" :
        selectedType === "social" ? "♿ Social Priority" :
        "🎫 Regular";

      toast.success(`${typeLabel} ticket created!`, {
        description: `Your ticket: ${ticketNumber} | Position: #${waitingTickets.length + 1}`,
      });
      navigate(`/ticket/${ticketNumber}`);
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  };

  // --- Loading & error states ---
  if (merchantLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: branding.primary }}>
        <div className="text-center" style={{ color: branding.textOnPrimary }}>
          <div className="text-6xl mb-4 animate-pulse">🎫</div>
          <p className="text-lg font-bold">Loading shop...</p>
        </div>
      </div>
    );
  }

  if (merchantError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Shop Not Found</h2>
          <p className="text-gray-700 mb-6">
            We couldn't find a shop with code: <strong>{merchantId}</strong>
          </p>
          <button onClick={() => navigate("/")} className="w-full bg-[#1E3A8A] text-white py-3 rounded-xl font-bold">
            ← Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen px-4 py-4 pb-12 brand-transition"
      style={{ background: `linear-gradient(to bottom, ${branding.primary}, ${branding.primary}cc, ${branding.primary}99)` }}
    >
      {/* Bunting */}
      <div className="bunting pt-2 pb-1">
        {Array.from({ length: buntingCount }).map((_, i) => (
          <div key={i} className="bunting-triangle" />
        ))}
      </div>

      {/* Header */}
      <div className="flex flex-col items-center mt-4 mb-6">
        {customLogo ? (
          <img src={customLogo} alt={brandName} className="w-20 h-20 mb-2 object-contain" style={{ maxWidth: "150px" }} />
        ) : (
          <PilaLogo className="w-20 h-20 mb-2" />
        )}
        <h1 className="text-xl font-bold text-center" style={{ color: branding.textOnPrimary }}>
          Welcome to {merchantName}!
        </h1>
        <p className="italic text-lg" style={{ color: branding.secondary }}>
          Ginhawa sa Bawat Pila
        </p>
      </div>

      {/* STEP 1: Queue Type Selection */}
      {step === "select" && (
        <div className="max-w-md mx-auto space-y-4">
          <h2 className="text-center text-lg font-bold" style={{ color: branding.textOnPrimary }}>
            Choose Your Entry:
          </h2>

          {/* REGULAR (Free) */}
          <button
            type="button"
            onClick={() => { setSelectedType("regular"); setStep("form"); }}
            className="w-full p-5 rounded-2xl border-2 border-white/30 hover:border-white hover:scale-[1.02] transition-all bg-white/10 backdrop-blur-sm text-left"
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-mono opacity-70" style={{ color: branding.textOnPrimary }}>Option 01</span>
                <p className="text-xl font-bold" style={{ color: branding.textOnPrimary }}>🎫 REGULAR LINE</p>
                <p className="text-sm opacity-80" style={{ color: branding.textOnPrimary }}>Standard waiting experience</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold" style={{ color: branding.secondary }}>FREE</p>
                <p className="text-xs opacity-70" style={{ color: branding.textOnPrimary }}>~{regularWait}</p>
              </div>
            </div>
          </button>

          {/* EXPRESS PASS (Paid) - Hidden for LINGKOD (government) */}
          {canShowExpress && (
            <button
              type="button"
              onClick={() => { setSelectedType("express"); setStep("form"); }}
              className="w-full p-5 rounded-2xl border-4 hover:scale-[1.02] transition-all relative overflow-hidden shadow-2xl text-left"
              style={{
                borderColor: branding.secondary,
                background: `linear-gradient(135deg, ${branding.secondary}30 0%, ${branding.secondary}50 100%)`,
              }}
            >
              {/* Glow badge */}
              <div
                className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold animate-pulse"
                style={{ backgroundColor: branding.secondary, color: branding.primary }}
              >
                ⚡ EXPRESS
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono opacity-70" style={{ color: branding.textOnPrimary }}>Option 02</span>
                  <p className="text-xl font-bold" style={{ color: branding.textOnPrimary }}>⚡ EXPRESS PASS</p>
                  <p className="text-sm opacity-80" style={{ color: branding.textOnPrimary }}>Jump the line (1:2 Ratio)</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold" style={{ color: branding.secondary }}>₱{expressPrice}</p>
                  <p className="text-xs opacity-70" style={{ color: branding.textOnPrimary }}>~{expressWait}</p>
                </div>
              </div>
            </button>
          )}

          {/* SOCIAL PRIORITY (Free, verified) */}
          <button
            type="button"
            onClick={() => { setSelectedType("social"); setStep("form"); }}
            className="w-full p-5 rounded-2xl border-2 border-green-400 bg-green-900/30 backdrop-blur-sm hover:border-green-300 hover:scale-[1.02] transition-all text-left"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">♿</span>
                <div>
                  <p className="text-xl font-bold text-white">SOCIAL PRIORITY</p>
                  <p className="text-sm text-green-200">Seniors, PWD, Pregnant</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-300">FREE</p>
                <p className="text-xs text-green-200">Verified Entry</p>
              </div>
            </div>
          </button>

          {/* Legal notice */}
          <p className="text-center text-xs opacity-60 mt-4" style={{ color: branding.textOnPrimary }}>
            By joining, you agree to the Pila-nihan Terms of Service. 🇵🇭
          </p>
        </div>
      )}

      {/* STEP 2: Details Form */}
      {step === "form" && (
        <div className="max-w-md mx-auto">
          <button
            type="button"
            onClick={() => { setStep("select"); setPriorityConfirmed(false); }}
            className="flex items-center gap-2 mb-4 hover:opacity-80 transition-opacity font-semibold"
            style={{ color: branding.secondary }}
          >
            ← Change Selection
          </button>

          {/* Selected type banner */}
          <div className="rounded-xl p-4 mb-4 text-center" style={{ backgroundColor: `${branding.secondary}30` }}>
            <p className="text-sm font-semibold" style={{ color: branding.textOnPrimary }}>Selected:</p>
            <p className="text-lg font-bold" style={{ color: branding.secondary }}>
              {selectedType === "express" && `⚡ Express Pass (₱${expressPrice})`}
              {selectedType === "social" && "♿ Social Priority (FREE)"}
              {selectedType === "regular" && "🎫 Regular Line (FREE)"}
            </p>
            <p className="text-xs opacity-70" style={{ color: branding.textOnPrimary }}>
              Est. Wait: ~{selectedType === "express" ? expressWait : regularWait}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-2xl p-6">
            <h2 className="text-xl font-bold text-[#1E3A8A] text-center mb-5">Enter Your Details</h2>

            {/* Name */}
            <div className="mb-4">
              <Label htmlFor="name" className="text-gray-700 font-semibold mb-1 block">
                Pangalan <span className="text-gray-500 font-normal">(Complete Name)</span>
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="Juan Dela Cruz"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="py-3 px-4 rounded-lg border-2 h-auto text-base"
                required
                autoFocus
                maxLength={50}
              />
            </div>

            {/* Mobile */}
            <div className="mb-5">
              <Label htmlFor="mobile" className="text-gray-700 font-semibold mb-1 block">
                Mobile Number
              </Label>
              <Input
                id="mobile"
                type="tel"
                placeholder="+63 917 123 4567"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                className={`py-3 px-4 rounded-lg border-2 h-auto text-base ${mobile && !validateMobile(mobile) ? "border-red-400" : ""}`}
                required
                maxLength={13}
              />
              {mobile && !validateMobile(mobile) && (
                <p className="text-xs text-red-500 mt-1">Must start with +63 or 09 (11 digits)</p>
              )}
            </div>

            {/* Social Priority verification */}
            {selectedType === "social" && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
                <div className="flex items-start gap-2">
                  <Checkbox
                    id="priority-confirm"
                    checked={priorityConfirmed}
                    onCheckedChange={(checked) => setPriorityConfirmed(checked === true)}
                  />
                  <label htmlFor="priority-confirm" className="text-sm text-gray-700 cursor-pointer leading-tight">
                    Ako ay Senior Citizen, PWD, o buntis at may dalang valid ID
                  </label>
                </div>
                <p className="text-xs text-green-700 italic mt-2">
                  Libreng serbisyo para sa ating mga nakatatanda at may kapansanan. ID verification required.
                </p>
              </div>
            )}

            {/* Express payment info */}
            {selectedType === "express" && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
                <p className="text-sm font-bold text-amber-900">💳 Payment Required: ₱{expressPrice}</p>
                <p className="text-xs text-amber-700 mt-1">
                  Pay via GCash or Maya after joining. Express tickets get priority placement (1 express : 2 regular ratio).
                </p>
                <p className="text-xs text-amber-600 mt-2 italic">
                  Price includes 12% VAT. No cash payments accepted (Bawal ang Fixer).
                </p>
              </div>
            )}

            {/* Location status indicators */}
            {locationStatus === "checking" && (
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-blue-600 animate-pulse">📍</span>
                  <p className="text-sm text-blue-700">Checking your location...</p>
                </div>
              </div>
            )}
            {locationStatus === "within_range" && distance !== null && (
              <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <div>
                    <p className="text-sm font-semibold text-green-800">You're within range!</p>
                    <p className="text-xs text-green-700">📍 {distance.toFixed(2)} km from shop</p>
                  </div>
                </div>
              </div>
            )}
            {locationStatus === "too_far" && distance !== null && (
              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-yellow-600">⚠️</span>
                  <div>
                    <p className="text-sm font-semibold text-yellow-800">Malayo pa po kayo</p>
                    <p className="text-xs text-yellow-700">📍 {distance.toFixed(2)} km away (Max: 20 km)</p>
                  </div>
                </div>
              </div>
            )}
            {(locationStatus === "error" || locationStatus === "not_supported") && (
              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-yellow-600">❌</span>
                  <div>
                    <p className="text-sm font-semibold text-yellow-800">Location unavailable</p>
                    <p className="text-xs text-yellow-700">{locationError || "Please enable location or use bypass code."}</p>
                  </div>
                </div>
              </div>
            )}

            {/* GPS Bypass Code */}
            {!bypassVerified && (locationStatus === "too_far" || locationStatus === "error" || locationStatus === "not_supported") && (
              <div className="text-center mb-4">
                <button type="button" onClick={() => setShowBypass(!showBypass)} className="text-sm text-[#3B82F6] font-medium hover:underline">
                  📍 Having GPS trouble? Enter bypass code
                </button>
                {showBypass && (
                  <div className="mt-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <p className="text-xs text-gray-600 mb-2">Ask the merchant for today's 6-character bypass code</p>
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        maxLength={6}
                        value={bypassCode}
                        onChange={(e) => setBypassCode(e.target.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().substring(0, 6))}
                        placeholder="e.g. 47X2B9"
                        className="text-center font-mono font-bold text-lg tracking-widest uppercase"
                        inputMode="text"
                        autoCapitalize="characters"
                        autoComplete="off"
                      />
                      <button
                        type="button"
                        onClick={handleBypassSubmit}
                        disabled={bypassCode.length !== 6}
                        className="bg-[#3B82F6] text-white px-4 py-2 rounded-lg font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                      >
                        Verify
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            {bypassVerified && (
              <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <p className="text-sm font-semibold text-green-800">Bypass code verified!</p>
                </div>
              </div>
            )}

            {/* Notification opt-in */}
            {isWithinRange && (
              <div className="bg-[#FFF9E6] border border-[#FFB703] rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🔔</span>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 mb-1">Get notified when it's your turn</h4>
                    <p className="text-xs text-gray-700 mb-3">We'll alert you when you're 3rd in line.</p>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={enablePushNotifications}
                        onChange={(e) => setEnablePushNotifications(e.target.checked)}
                        className="w-4 h-4 rounded accent-[#FFB703]"
                      />
                      <span className="text-sm font-medium text-gray-800">Enable push notifications</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={!isFormValid}
              className={`w-full py-4 rounded-xl font-bold uppercase text-lg shadow-lg transition-colors ${
                isFormValid
                  ? "text-white hover:opacity-90"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
              style={isFormValid ? { backgroundColor: branding.secondary, color: branding.primary } : undefined}
            >
              {locationStatus === "checking"
                ? "Checking location..."
                : !isWithinRange
                ? "Too far from shop (20km max)"
                : selectedType === "express"
                ? `Pay ₱${expressPrice} & Join →`
                : "Kumuha ng Ticket"}
            </button>

            <p className="text-xs text-gray-500 text-center mt-4">
              ⚠️ Priority tickets require valid ID verification at counter. Bawal ang Fixer — digital payments only.
            </p>
          </form>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-center gap-2 mt-6">
        <span className="w-2 h-2 bg-green-400 rounded-full" />
        <span className="text-xs" style={{ color: `${branding.textOnPrimary}80` }}>Powered by Pila-nihan™</span>
      </div>
    </div>
  );
};

export default GuestEntry;
