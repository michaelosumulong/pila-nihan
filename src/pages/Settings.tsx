import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import PilaLogo from "@/components/PilaLogo";
import { useBranding } from "@/contexts/BrandingContext";
import VersionFooter from "@/components/VersionFooter";

const BRAND_PRESETS = [
  {
    id: "classic",
    name: "Pila-nihan Classic",
    primary: "#0A2569",
    secondary: "#FFB703",
    accent: "#FCD116",
    textOnPrimary: "#FFFFFF",
    emoji: "🇵🇭",
    description: "Filipino Pride",
  },
  {
    id: "jollibee",
    name: "Jollibee Style",
    primary: "#DD0031",
    secondary: "#FFB81C",
    accent: "#FFFFFF",
    textOnPrimary: "#FFFFFF",
    emoji: "🍔",
    description: "Fast Food Favorite",
  },
  {
    id: "sm",
    name: "SM Blue",
    primary: "#004B87",
    secondary: "#FDB913",
    accent: "#FFFFFF",
    textOnPrimary: "#FFFFFF",
    emoji: "🛍️",
    description: "Retail Excellence",
  },
  {
    id: "mercury",
    name: "Mercury Drug",
    primary: "#006747",
    secondary: "#FFFFFF",
    accent: "#FFB703",
    textOnPrimary: "#FFFFFF",
    emoji: "💊",
    description: "Healthcare Professional",
  },
  {
    id: "pastel",
    name: "Modern Pastel",
    primary: "#6366F1",
    secondary: "#F59E0B",
    accent: "#FFFFFF",
    textOnPrimary: "#FFFFFF",
    emoji: "✨",
    description: "Contemporary Chic",
  },
];

export { BRAND_PRESETS };

const CATEGORIES = ["AGOS", "SULONG", "ALON"];

const Settings = () => {
  const navigate = useNavigate();

  // Saved merchant state (from localStorage)
  const [savedMerchant, setSavedMerchant] = useState(() => {
    const stored = localStorage.getItem("pila-merchant");
    return stored
      ? JSON.parse(stored)
      : {
          businessName: "",
          shopCode: "",
          category: "AGOS",
          targetHandlingTime: 8,
          branding: BRAND_PRESETS[0],
          customLogo: null,
          foundingNumber: null,
        };
  });

  // Temp state for pending changes
  const [tempBusinessName, setTempBusinessName] = useState(savedMerchant.businessName || "");
  const [tempShopCode, setTempShopCode] = useState(savedMerchant.shopCode || "");
  const [tempCategory, setTempCategory] = useState(savedMerchant.category || "AGOS");
  const [tempTargetTime, setTempTargetTime] = useState(savedMerchant.targetHandlingTime || 8);
  const [tempPreset, setTempPreset] = useState(savedMerchant.branding?.id || "classic");
  const [tempLogo, setTempLogo] = useState(savedMerchant.customLogo || null);

  const [lowBatteryMode, setLowBatteryMode] = useState(
    localStorage.getItem("pila-low-battery") === "true"
  );

  // Detect unsaved changes
  const hasChanges =
    tempBusinessName !== (savedMerchant.businessName || "") ||
    tempShopCode !== (savedMerchant.shopCode || "") ||
    tempCategory !== (savedMerchant.category || "AGOS") ||
    tempTargetTime !== (savedMerchant.targetHandlingTime || 8) ||
    tempPreset !== (savedMerchant.branding?.id || "classic") ||
    tempLogo !== (savedMerchant.customLogo || null);

  const { refreshBranding } = useBranding();

  // Apply all changes
  const applyChanges = () => {
    const selectedBranding = BRAND_PRESETS.find((p) => p.id === tempPreset) || BRAND_PRESETS[0];
    const updated = {
      ...savedMerchant,
      businessName: tempBusinessName,
      shopCode: tempShopCode.toUpperCase().replace(/[^A-Z0-9]/g, ""),
      category: tempCategory,
      targetHandlingTime: Math.max(1, Math.min(120, tempTargetTime)),
      branding: selectedBranding,
      customLogo: tempLogo,
    };
    localStorage.setItem("pila-merchant", JSON.stringify(updated));

    // Update saved state so hasChanges becomes false immediately
    setSavedMerchant(updated);

    // CRITICAL: Reset ALL temp states to match saved values
    setTempBusinessName(updated.businessName);
    setTempShopCode(updated.shopCode);
    setTempCategory(updated.category);
    setTempTargetTime(updated.targetHandlingTime);
    setTempPreset(updated.branding.id);
    setTempLogo(updated.customLogo);

    // Broadcast to all components via context + custom event
    refreshBranding();
    window.dispatchEvent(new CustomEvent("merchant-updated"));

    toast.success("Settings applied successfully!", {
      description: "Your changes are now live across all pages.",
    });
  };

  // Discard changes
  const discardChanges = () => {
    setTempBusinessName(savedMerchant.businessName || "");
    setTempShopCode(savedMerchant.shopCode || "");
    setTempCategory(savedMerchant.category || "AGOS");
    setTempTargetTime(savedMerchant.targetHandlingTime || 8);
    setTempPreset(savedMerchant.branding?.id || "classic");
    setTempLogo(savedMerchant.customLogo || null);
    toast.info("Changes discarded");
  };

  const handlePresetChange = (presetId: string) => {
    const preset = BRAND_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setTempPreset(presetId);
    }
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (PNG, JPG)");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File too large. Maximum size: 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setTempLogo(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = () => setTempLogo(null);

  const toggleLowBattery = () => {
    const newValue = !lowBatteryMode;
    setLowBatteryMode(newValue);
    localStorage.setItem("pila-low-battery", String(newValue));
    toast.success(`Low Battery Mode ${newValue ? "enabled" : "disabled"}`);
  };

  const previewBranding = BRAND_PRESETS.find((p) => p.id === tempPreset) || BRAND_PRESETS[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A2569] to-[#1E3A8A] p-4 md:p-6 pb-24">
      {/* Sticky Apply/Discard Bar */}
      {hasChanges && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t-2 border-[#FFB703] shadow-2xl px-4 py-3">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-lg">⚠️</span>
              <span className="font-semibold text-gray-900">You have unsaved changes</span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={discardChanges}
                className="px-4 py-2 rounded-lg border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-100 transition-colors text-sm"
              >
                Discard
              </button>
              <button
                onClick={applyChanges}
                className="px-6 py-2 rounded-lg bg-[#10B981] text-white font-bold hover:bg-[#059669] transition-colors text-sm shadow-lg"
              >
                ✓ Apply Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="max-w-5xl mx-auto mb-6">
        <button
          onClick={() => {
            if (hasChanges) {
              if (window.confirm("You have unsaved changes. Discard them?")) {
                navigate("/dashboard");
              }
            } else {
              navigate("/dashboard");
            }
          }}
          className="text-white hover:text-[#FFB703] flex items-center gap-2 mb-4 font-medium"
        >
          ← Back to Dashboard
        </button>
        <div className="flex items-center gap-3">
          <PilaLogo className="w-12 h-12" />
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-[#FFB703]">
              Settings
            </h1>
            <p className="text-[#FDFBD4] text-sm">
              Customize your merchant profile and branding
            </p>
          </div>
        </div>
      </div>

      {/* Founding Merchant Banner */}
      {savedMerchant.foundingNumber && savedMerchant.foundingNumber <= 50 && (
        <div className="max-w-5xl mx-auto mb-6">
          <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-xl p-4 shadow-xl border border-purple-400">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🏆</span>
              <div className="flex-1">
                <p className="text-white font-bold text-lg">
                  Founding Merchant Status Active
                </p>
                <p className="text-white/90 text-sm">
                  All Branding and SURI AI features unlocked for your 2-month
                  trial
                </p>
              </div>
              <div className="bg-white/20 rounded-lg px-4 py-2 text-center">
                <p className="text-white font-bold">
                  #{savedMerchant.foundingNumber}
                </p>
                <p className="text-white/80 text-xs">of 50</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto space-y-6">
        {/* SECTION 1: BUSINESS PROFILE */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-[#FFB703]/20">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            🏢 Business Profile
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Business Name
              </label>
              <input
                type="text"
                value={tempBusinessName}
                onChange={(e) => setTempBusinessName(e.target.value)}
                placeholder="Your Business Name"
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-[#1E3A8A] outline-none text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Shop Code
              </label>
              <input
                type="text"
                value={tempShopCode}
                onChange={(e) =>
                  setTempShopCode(
                    e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "")
                  )
                }
                placeholder="SHOPCODE"
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-[#1E3A8A] outline-none uppercase text-gray-900"
                maxLength={10}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Business Category
              </label>
              <select
                value={tempCategory}
                onChange={(e) => setTempCategory(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-[#1E3A8A] outline-none text-gray-900"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                AGOS (Fast) • SULONG (Medium) • ALON (Slow)
              </p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Target Handling Time
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={tempTargetTime}
                  onChange={(e) =>
                    setTempTargetTime(
                      Math.max(1, Math.min(120, Number(e.target.value) || 1))
                    )
                  }
                  min="1"
                  max="120"
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-[#1E3A8A] outline-none text-gray-900"
                />
                <span className="text-gray-600 font-semibold whitespace-nowrap">
                  min
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Takt Time: Average minutes per customer
              </p>
            </div>
          </div>
        </div>

        {/* SECTION 2: BRANDING SUITE */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-[#FFB703]/20">
          <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2 flex-wrap">
            🎨 Branding Suite
            <span className="text-sm font-normal text-purple-600 bg-purple-100 px-3 py-1 rounded-full">
              SINAG Feature
            </span>
          </h2>
          <p className="text-gray-600 mb-6">
            Customize how your queue looks to customers. Choose a preset that
            matches your business.
          </p>

          {/* Live Preview */}
          <div className="mb-6">
            <p className="text-sm font-semibold text-gray-700 mb-2">Live Preview:</p>
            <div
              className="rounded-xl p-4 flex items-center gap-4"
              style={{ backgroundColor: previewBranding.primary }}
            >
              {tempLogo ? (
                <img src={tempLogo} alt="Logo" className="h-12 object-contain" style={{ maxWidth: "80px" }} />
              ) : (
                <span className="text-3xl" style={{ color: previewBranding.secondary }}>
                  {previewBranding.emoji}
                </span>
              )}
              <div>
                <p className="font-bold" style={{ color: previewBranding.secondary }}>
                  {tempBusinessName || "Your Business"}
                </p>
                <p className="text-xs italic" style={{ color: previewBranding.textOnPrimary, opacity: 0.8 }}>
                  Ginhawa sa Bawat Pila
                </p>
              </div>
            </div>
          </div>

          {/* Preset Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
            {BRAND_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handlePresetChange(preset.id)}
                className={`relative p-3 md:p-4 rounded-xl border-2 transition-all ${
                  tempPreset === preset.id
                    ? "border-purple-600 bg-purple-50 shadow-lg scale-105"
                    : "border-gray-200 hover:border-gray-300 hover:shadow-md"
                }`}
              >
                <div
                  className="h-16 md:h-20 rounded-lg mb-3 flex items-center justify-center"
                  style={{ backgroundColor: preset.primary }}
                >
                  <div
                    className="text-2xl md:text-3xl font-bold px-3 py-1.5 rounded-lg"
                    style={{
                      backgroundColor: preset.secondary,
                      color: preset.textOnPrimary,
                    }}
                  >
                    {preset.emoji}
                  </div>
                </div>
                <h3 className="font-bold text-gray-900 text-xs md:text-sm mb-1">
                  {preset.name}
                </h3>
                <p className="text-xs text-gray-600 hidden md:block">
                  {preset.description}
                </p>
                {tempPreset === preset.id && (
                  <div className="absolute top-2 right-2 bg-purple-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    ✓
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Logo Upload */}
          <div className="border-t pt-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Custom Logo
            </h3>
            <div className="flex flex-col md:flex-row items-start gap-6">
              <div className="flex-1 w-full">
                <label className="block border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-all">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <div className="text-4xl mb-3">📸</div>
                  <p className="text-sm font-semibold text-gray-700 mb-1">
                    Click to upload logo
                  </p>
                  <p className="text-xs text-gray-500">
                    PNG or JPG, max 2MB, recommended 500×500px
                  </p>
                </label>
              </div>
              <div className="w-full md:w-64">
                <p className="text-sm font-semibold text-gray-700 mb-2">
                  Preview:
                </p>
                <div
                  className="rounded-xl p-4 h-40 flex items-center justify-center"
                  style={{ backgroundColor: previewBranding.primary }}
                >
                  {tempLogo ? (
                    <div className="relative">
                      <img
                        src={tempLogo}
                        alt="Custom logo"
                        className="max-h-32 max-w-full object-contain"
                        style={{ maxWidth: "150px" }}
                      />
                      <button
                        onClick={removeLogo}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 shadow-lg"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div
                        className="text-4xl mb-2"
                        style={{ color: previewBranding.secondary }}
                      >
                        {previewBranding.emoji}
                      </div>
                      <p
                        className="text-xs"
                        style={{
                          color: previewBranding.textOnPrimary,
                          opacity: 0.8,
                        }}
                      >
                        Default logo
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Beta Note */}
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded mt-6">
            <p className="text-sm text-yellow-800">
              <strong>💡 Beta Note:</strong> All Founding Merchants get full
              branding access during the 2-month trial. After beta, this feature
              requires SINAG (₱999/mo) or higher.
            </p>
          </div>
        </div>

        {/* SECTION 3: APP PREFERENCES */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-[#FFB703]/20">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            ⚙️ App Preferences
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-semibold text-gray-900">Low Battery Mode</p>
                <p className="text-sm text-gray-600">
                  Reduces animations and refresh rate to save battery
                </p>
              </div>
              <button
                onClick={toggleLowBattery}
                className={`relative w-14 h-7 rounded-full transition-colors ${
                  lowBatteryMode ? "bg-green-500" : "bg-gray-300"
                }`}
              >
                <div
                  className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-transform ${
                    lowBatteryMode ? "translate-x-7" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-semibold text-gray-900">Notifications</p>
                <p className="text-sm text-gray-600">
                  Sound and vibration alerts for queue events
                </p>
              </div>
              <span className="text-xs text-gray-400 bg-gray-200 px-3 py-1 rounded-full">
                Coming Soon
              </span>
            </div>
          </div>
        </div>

        {/* SECTION 4: DANGER ZONE */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-red-200">
          <h2 className="text-xl font-bold text-red-600 mb-4">⚠️ Danger Zone</h2>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-red-50 rounded-lg">
            <div>
              <p className="font-semibold text-gray-900">Reset All Data</p>
              <p className="text-sm text-gray-600">
                Clear all merchant data, queue history, and settings
              </p>
            </div>
            <button
              onClick={() => {
                if (
                  window.confirm(
                    "Are you sure? This will delete all your data and cannot be undone."
                  )
                ) {
                  localStorage.clear();
                  toast.success("All data cleared");
                  navigate("/");
                }
              }}
              className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-red-700 whitespace-nowrap"
            >
              Reset Everything
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto mt-8">
        <VersionFooter />
      </div>
    </div>
  );
};

export default Settings;
