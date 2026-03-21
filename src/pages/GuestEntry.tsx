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

const DEMO_MERCHANTS: Record<string, any> = {
  pilani: {
    id: "demo-pilani", businessName: "Pilanihan Demo", shopCode: "PILANI", category: "AGOS",
    location: { lat: 14.5826, lng: 121.0527 }, address: "Pasig City, Metro Manila",
    ownerName: "Demo Owner", mobile: "09171234567", targetHandlingTime: 8,
  },
  pilanihan: {
    id: "demo-pilanihan", businessName: "Pilanihan", shopCode: "PILANIHAN", category: "AGOS",
    location: { lat: 14.5826, lng: 121.0527 }, address: "Pasig City, Metro Manila",
    ownerName: "Demo Owner", mobile: "09171234567", targetHandlingTime: 8,
  },
  demo: {
    id: "demo-test", businessName: "Demo Shop", shopCode: "DEMO", category: "SULONG",
    location: { lat: 14.5826, lng: 121.0527 }, address: "Pasig City, Metro Manila",
    ownerName: "Test User", mobile: "09171234567", targetHandlingTime: 10,
  },
};

const GuestEntry = () => {
  const { merchantId } = useParams();
  const navigate = useNavigate();
  const { branding, customLogo, businessName: brandName } = useBranding();
  const buntingCount = 24;

  const [merchantData, setMerchantData] = useState<any>(null);
  const [merchantLoading, setMerchantLoading] = useState(true);
  const [merchantError, setMerchantError] = useState(false);

  // Discover merchant on mount
  useEffect(() => {
    const cleanId = merchantId?.toLowerCase().replace(/[^a-z0-9]/g, "") || "";

    // Guard against literal parameter name in URL
    if (!cleanId || cleanId === "merchantid") {
      toast.error("Invalid shop link", {
        description: "Please enter a valid shop code on the home page.",
        duration: 5000,
      });
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
      toast.error("Shop not found", {
        description: `Could not find shop with code: ${merchantId}`,
        duration: 8000,
      });
    }
  }, [merchantId]);

  const merchantName = merchantData?.businessName || "Pila-nihan Queue System";
  const merchantLocation = merchantData?.location || { lat: 14.5995, lng: 120.9842 };

  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"regular" | "priority">("regular");
  const [priorityConfirmed, setPriorityConfirmed] = useState(false);
  const [enablePushNotifications, setEnablePushNotifications] = useState(true);

  const [customerLocation, setCustomerLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [isWithinRange, setIsWithinRange] = useState(false);
  const [locationStatus, setLocationStatus] = useState<"checking" | "within_range" | "too_far" | "error" | "not_supported">("checking");

  const [showBypass, setShowBypass] = useState(false);
  const [bypassCode, setBypassCode] = useState("");
  const [bypassVerified, setBypassVerified] = useState(false);

  const handleBypassSubmit = () => {
    const seed = merchantData.id || "pila-nihan";
    if (validateBypassCode(bypassCode, seed)) {
      setBypassVerified(true);
      setIsWithinRange(true);
      setLocationStatus("within_range");
      toast.success("Bypass code accepted! You can now join the queue.");
    } else {
      toast.error("Invalid bypass code. Ask the merchant for today's code.");
    }
  };

  const [locationError, setLocationError] = useState("");

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
      toast.warning("Location not available", {
        description: "Use the bypass code from the merchant to continue",
        duration: 8000,
      });
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
        console.error("Geolocation error:", error);
        let errorMsg = "Location access denied.";
        if (error.code === 1) errorMsg = "Location permission denied. Please enable location in your browser settings.";
        else if (error.code === 2) errorMsg = "Location unavailable. Check your GPS/WiFi connection.";
        else if (error.code === 3) errorMsg = "Location request timed out.";
        setLocationStatus("error");
        setLocationError(errorMsg);
        toast.warning("Location not available", {
          description: "Use the bypass code from the merchant to continue",
          duration: 8000,
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );

    return () => clearTimeout(locationTimeout);
  }, [merchantData, merchantLocation.lat, merchantLocation.lng]);

  const isValid =
    name.trim() !== "" &&
    validateMobile(mobile) &&
    (selectedCategory === "regular" || priorityConfirmed) &&
    isWithinRange &&
    locationStatus === "within_range";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) {
      toast.error("Please fill in all required fields correctly.");
      return;
    }
    try {
      const existingTickets = JSON.parse(localStorage.getItem("tickets") || "[]");
      const prefix = selectedCategory === "priority" ? "P" : "R";
      const sameTypeTickets = existingTickets.filter((t: any) => t.ticketNumber?.startsWith(prefix));
      const nextNumber = String(sameTypeTickets.length + 1).padStart(3, "0");
      const ticketNumber = `${prefix}-${nextNumber}`;
      const waitingTickets = existingTickets.filter((t: any) => t.status === "waiting");

      const newTicket = {
        id: `ticket-${Date.now()}`,
        merchant_id: merchantData.id || merchantId || "default",
        ticketNumber,
        customerName: name.trim(),
        mobile: mobile.trim(),
        category: selectedCategory,
        status: "waiting",
        joined_at: new Date().toISOString(),
        called_at: null,
        serving_started_at: null,
        completed_at: null,
        wait_time_minutes: null,
        handling_time_minutes: null,
        is_social_priority: selectedCategory === "priority",
        priority_reason: selectedCategory === "priority" ? "senior_pwd_pregnant" : null,
        paid_amount: 0.0,
        position: waitingTickets.length + 1,
        totalInQueue: waitingTickets.length + 1,
        estimatedWaitMinutes: (waitingTickets.length + 1) * 8,
        nowServing: existingTickets.find((t: any) => t.status === "serving")?.ticketNumber || "N/A",
        customer_location: customerLocation,
        distance_from_merchant: distance,
        push_notifications_enabled: enablePushNotifications,
      };

      existingTickets.push(newTicket);
      localStorage.setItem("tickets", JSON.stringify(existingTickets));

      // Save active ticket for recovery
      localStorage.setItem("pila-active-ticket", JSON.stringify({
        ticketNumber,
        customerName: name.trim(),
        status: "waiting",
        savedAt: new Date().toISOString(),
      }));

      addNotification({
        title: "Ticket Created!",
        message: `You are now in the queue. Position #${waitingTickets.length + 1}.`,
        type: "success",
        ticketNumber,
      });
      toast.success(`Ticket ${ticketNumber} created!`, {
        description: `Welcome, ${name.trim()}!`,
      });
      navigate(`/ticket/${ticketNumber}`);
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  };

  if (merchantLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#002366] via-[#1E5AA8] to-[#3B82F6] flex items-center justify-center">
        <div className="text-white text-center">
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
          <p className="text-sm text-gray-500 mb-6">
            Make sure there are no dashes or spaces. Just letters and numbers.
          </p>
          <button onClick={() => navigate("/")} className="w-full bg-[#1E3A8A] text-white py-3 rounded-xl font-bold">
            ← Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#002366] via-[#1E5AA8] to-[#3B82F6] px-6 py-4 pb-12">
      {/* Bunting */}
      <div className="bunting pt-2 pb-1">
        {Array.from({ length: buntingCount }).map((_, i) => (
          <div key={i} className="bunting-triangle" />
        ))}
      </div>

      {/* Header */}
      <div className="flex flex-col items-center mt-4 mb-6">
        <PilaLogo className="w-24 h-24 mb-2" />
        <h1 className="text-xl font-bold text-white text-center">Welcome to {merchantName}!</h1>
        <p className="text-[#FFD700] italic text-lg">Ginhawa sa Bawat Pila</p>
      </div>

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-2xl p-8 max-w-md mx-auto mb-6">
        <h2 className="text-2xl font-bold text-[#1E3A8A] text-center mb-6">Kumuha ng Ticket</h2>

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
          />
        </div>

        {/* Mobile */}
        <div className="mb-6">
          <Label htmlFor="mobile" className="text-gray-700 font-semibold mb-1 block">
            Mobile Number
          </Label>
          <Input
            id="mobile"
            type="tel"
            placeholder="+63 917 123 4567"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            className={`py-3 px-4 rounded-lg border-2 h-auto text-base ${
              mobile && !validateMobile(mobile) ? "border-red-400" : ""
            }`}
            required
          />
          {mobile && !validateMobile(mobile) && (
            <p className="text-xs text-red-500 mt-1">Must start with +63 or 09 (11 digits)</p>
          )}
        </div>

        {/* Category Selection */}
        <div className="mb-4">
          <Label className="text-gray-700 font-semibold mb-2 block">Category</Label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => { setSelectedCategory("regular"); setPriorityConfirmed(false); }}
              className={`rounded-2xl border-2 p-4 text-center transition-all ${
                selectedCategory === "regular" ? "border-[#3B82F6] bg-blue-50" : "border-gray-300 bg-white"
              }`}
            >
              <span className="text-3xl block">👥</span>
              <p className="font-bold mt-1">Regular</p>
              <p className="text-sm text-gray-600">Standard queue</p>
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory("priority")}
              className={`rounded-2xl border-2 p-4 text-center transition-all ${
                selectedCategory === "priority" ? "border-[#10B981] bg-green-50" : "border-gray-300 bg-white"
              }`}
            >
              <span className="text-3xl block">🤝</span>
              <p className="font-bold mt-1">Priority</p>
              <span className="inline-block bg-[#10B981] text-white text-xs px-2 py-0.5 rounded mb-1">LIBRE</span>
              <p className="text-sm text-gray-600">Senior / PWD / Buntis</p>
            </button>
          </div>
        </div>

        {/* Priority Verification */}
        {selectedCategory === "priority" && (
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
              Libreng serbisyo para sa ating mga nakatatanda at may kapansanan.
            </p>
          </div>
        )}

        {/* Distance Indicator */}
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
                <p className="text-xs text-green-700">📍 Kasalukuyang layo: {distance.toFixed(2)} km mula sa tindahan</p>
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
                <p className="text-xs text-yellow-700">📍 Current distance: {distance.toFixed(2)} km (Max: 20 km)</p>
                <p className="text-xs text-yellow-700 mt-1">Please be within 20 km to secure a spot in the queue.</p>
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
                <p className="text-xs text-yellow-700">{locationError || "Please enable location services or use bypass code."}</p>
              </div>
            </div>
          </div>
        )}

        {/* GPS Bypass Code */}
        {!bypassVerified && (locationStatus === "too_far" || locationStatus === "error" || locationStatus === "not_supported") && (
          <div className="text-center mb-4">
            <button
              type="button"
              onClick={() => setShowBypass(!showBypass)}
              className="text-sm text-[#3B82F6] font-medium hover:underline"
            >
              📍 Having GPS trouble? Enter bypass code
            </button>
            {showBypass && (
              <div className="mt-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-xs text-gray-600 mb-2">
                  Ask the merchant for today's 6-character bypass code
                </p>
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
              <div>
                <p className="text-sm font-semibold text-green-800">Bypass code verified!</p>
                <p className="text-xs text-green-700">You can now join the queue.</p>
              </div>
            </div>
          </div>
        )}

        {isWithinRange && (
          <div className="bg-[#FFF9E6] border border-[#FFB703] rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🔔</span>
              <div className="flex-1">
                <h4 className="font-bold text-gray-900 mb-1">Get notified when it's your turn</h4>
                <p className="text-xs text-gray-700 mb-3">
                  We'll send you alerts when you're 3rd in line so you can walk over from nearby shops.
                </p>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enablePushNotifications}
                    onChange={(e) => setEnablePushNotifications(e.target.checked)}
                    className="w-4 h-4 rounded accent-[#FFB703]"
                  />
                  <span className="text-sm font-medium text-gray-800">Enable push notifications (Recommended)</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={!isValid}
          className={`w-full py-4 rounded-xl font-bold uppercase text-lg shadow-lg transition-colors ${
            isValid
              ? "bg-[#FFD700] text-white hover:bg-[#F59E0B]"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          {locationStatus === "checking"
            ? "Checking location..."
            : !isWithinRange
            ? "Too far from shop (20km max)"
            : "Kumuha ng Ticket"}
        </button>

        {/* Anti-fraud note */}
        <p className="text-xs text-gray-500 text-center mt-4">
          ⚠️ Priority tickets require valid ID verification at counter. Abuse of social priority may result in ticket cancellation.
        </p>
      </form>

      {/* Auto-refresh indicator */}
      <div className="flex items-center justify-center gap-2">
        <span className="w-2 h-2 bg-green-400 rounded-full" />
        <span className="text-xs text-gray-300">Powered by Pila-nihan™</span>
      </div>
    </div>
  );
};

export default GuestEntry;
