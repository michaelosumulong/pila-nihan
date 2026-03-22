import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import PilaLogo from "@/components/PilaLogo";
import { BRAND_PRESETS } from "@/pages/Settings";

const SERVICE_PLANS = [
  {
    id: "panday",
    name: "PANDAY",
    subtitle: "Standard",
    price: "FREE",
    features: [
      "Basic queue management",
      "Ticket generation",
      "Real-time queue display",
      "30-day history",
    ],
    color: "#6B7280",
  },
  {
    id: "sinag",
    name: "SINAG",
    subtitle: "Standard + Insights",
    price: "₱999/mo",
    features: [
      "Everything in PANDAY",
      "Analytics dashboard",
      "Peak hour forecasting",
      "1-year history",
      "Custom branding",
    ],
    color: "#F59E0B",
    recommended: true,
  },
  {
    id: "suri",
    name: "SURI",
    subtitle: "Standard + Insights + Expert AI",
    price: "₱3,499/mo",
    features: [
      "Everything in SINAG",
      "AI root cause analysis",
      "Automated backlog detection",
      "Takt Time optimization",
      "White-labeling",
      "Priority support",
    ],
    color: "#8B5CF6",
  },
];

const BUSINESS_CATEGORIES = [
  {
    id: "lingkod",
    name: "LINGKOD",
    subtitle: "Government / Public Service",
    description: "Government offices, public services, community centers",
    icon: "🏛️",
    examples: "Barangay halls, LGU offices, public hospitals",
    canChargeExpress: false,
  },
  {
    id: "sulong",
    name: "SULONG",
    subtitle: "Small & Medium Business",
    description: "SMBs, local shops, family-owned businesses",
    icon: "🏪",
    examples: "Sari-sari stores, small clinics, barbershops, carinderia",
    canChargeExpress: true,
  },
  {
    id: "agos",
    name: "AGOS",
    subtitle: "Commercial / High-Volume",
    description: "Large businesses, franchises, high-traffic establishments",
    icon: "🏢",
    examples: "Jollibee, Mercury Drug, SM branches, banks",
    canChargeExpress: true,
  },
];

const MerchantSignup = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    businessName: "",
    ownerName: "",
    mobile: "",
    email: "",
    address: "",
    servicePlan: "panday",
    businessCategory: "sulong",
  });
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState("");

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          setLocationError("Unable to get location. Please enable location services.");
          console.error("Geolocation error:", error);
        }
      );
    }
  }, []);

  const update = (field: string, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: "" }));
  };

  const validateStep1 = () => {
    const e: Record<string, string> = {};
    if (!form.businessName.trim()) e.businessName = "Kinakailangan";
    if (!form.ownerName.trim()) e.ownerName = "Kinakailangan";
    if (!form.mobile.trim()) e.mobile = "Kinakailangan";
    if (!form.address.trim()) e.address = "Kinakailangan";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && !validateStep1()) return;
    setStep((s) => Math.min(s + 1, 3));
  };

  const handleBack = () => setStep((s) => Math.max(s - 1, 1));

  const handleSubmit = () => {
    if (!agreed) {
      setErrors({ terms: "Kailangan mong sumang-ayon" });
      return;
    }

    // Generate shop code from business name
    let shopCode = form.businessName
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .substring(0, 10);
    if (shopCode.length < 3) {
      shopCode = (shopCode + "SHOP").substring(0, 6);
    }

    // Default Service Pace based on Business Category
    const defaultServicePace =
      form.businessCategory === "lingkod" ? "Technical" :
      form.businessCategory === "agos" ? "Express" :
      "Standard";

    const defaultTargetTime =
      defaultServicePace === "Express" ? 5 :
      defaultServicePace === "Technical" ? 45 :
      15;

    const data = {
      id: `MERCH-${Date.now()}`,
      businessName: form.businessName,
      ownerName: form.ownerName,
      mobile: form.mobile,
      email: form.email,
      address: form.address,
      location: location || { lat: 14.5995, lng: 120.9842 },
      shopCode,
      servicePlan: form.servicePlan,
      businessCategory: form.businessCategory,
      category: defaultServicePace,
      targetHandlingTime: defaultTargetTime,
      plan: form.servicePlan.toUpperCase(),
      branding: BRAND_PRESETS[0],
      customLogo: null,
      prepaidCredits: 0,
      foundingMerchantNumber: null,
      wallet: { balance: 0, credits: 500 },
      settings: {
        targetHandlingTime: defaultTargetTime,
        isPriorityEnabled: form.businessCategory !== "lingkod",
        prepaidCredits: 0,
      },
      joinedDate: new Date().toISOString(),
    };

    localStorage.setItem("pila-merchant", JSON.stringify(data));
    window.dispatchEvent(new CustomEvent("merchant-updated"));
    console.log("Merchant saved:", data);

    toast.success("Account created!", {
      description: `Welcome to Pila-nihan, ${form.businessName}!`,
    });

    setTimeout(() => navigate("/dashboard"), 500);
  };

  const selectedPlan = SERVICE_PLANS.find((p) => p.id === form.servicePlan);
  const selectedCategory = BUSINESS_CATEGORIES.find((c) => c.id === form.businessCategory);
  const buntingCount = 24;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#002366] to-[#1E5AA8]">
      {/* Bunting */}
      <div className="bunting pt-2 pb-1">
        {Array.from({ length: buntingCount }).map((_, i) => (
          <div key={i} className="bunting-triangle" />
        ))}
      </div>

      <div className="max-w-lg mx-auto px-5 pb-10">
        {/* Logo */}
        <div className="flex flex-col items-center pt-8 pb-4">
          <PilaLogo className="w-24 h-24 mb-3" />
          <h1 className="text-3xl font-bold text-primary tracking-wide">PILA-NIHAN™</h1>
          <p className="text-[#FFD700] italic text-lg mt-1">Merchant Signup</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  step >= s
                    ? "bg-[#FFD700] text-[#0A2569]"
                    : "bg-white/20 text-white/50"
                }`}
              >
                {s}
              </div>
              {s < 3 && (
                <div
                  className={`w-8 h-0.5 ${
                    step > s ? "bg-[#FFD700]" : "bg-white/20"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-center gap-6 mb-6 text-xs">
          <span className={step >= 1 ? "text-[#FFD700]" : "text-white/40"}>Business Info</span>
          <span className={step >= 2 ? "text-[#FFD700]" : "text-white/40"}>Service Plan</span>
          <span className={step >= 3 ? "text-[#FFD700]" : "text-white/40"}>Category</span>
        </div>

        {/* STEP 1: Business Info */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="bg-white/10 rounded-xl p-5 border border-white/20">
              <h2 className="text-lg font-bold text-white mb-4">📋 Business Information</h2>
              <div className="space-y-3">
                <Field
                  label="Business Name"
                  value={form.businessName}
                  onChange={(v) => update("businessName", v)}
                  placeholder="Aling Nena's Tindahan"
                  error={errors.businessName}
                  required
                />
                <Field
                  label="Owner Name"
                  value={form.ownerName}
                  onChange={(v) => update("ownerName", v)}
                  placeholder="Nena Santos"
                  error={errors.ownerName}
                  required
                />
                <Field
                  label="Mobile Number"
                  value={form.mobile}
                  onChange={(v) => update("mobile", v)}
                  placeholder="+63 917 123 4567"
                  error={errors.mobile}
                  required
                />
                <Field
                  label="Email"
                  value={form.email}
                  onChange={(v) => update("email", v)}
                  placeholder="nena@example.com"
                  type="email"
                />
                {/* Address */}
                <div>
                  <label className="block text-sm font-medium text-white/90 mb-1">
                    Address <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    value={form.address}
                    onChange={(e) => update("address", e.target.value)}
                    placeholder="123 Barangay St, Manila"
                    rows={2}
                    className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#FFD700] resize-none"
                  />
                  {errors.address && <p className="text-red-400 text-xs mt-1">{errors.address}</p>}
                  <div className="text-sm mt-1">
                    {location ? (
                      <span className="text-green-400 text-xs">
                        ✓ Location captured: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                      </span>
                    ) : (
                      <span className="text-yellow-400 text-xs">
                        ⚠️ {locationError || "Getting location..."}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleNext}
              className="w-full bg-[#FFD700] hover:bg-[#F59E0B] active:scale-95 text-[#0A2569] font-bold py-4 text-lg rounded-lg transition-all"
            >
              Next: Choose Plan →
            </button>
          </div>
        )}

        {/* STEP 2: Service Plan */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="bg-white/10 rounded-xl p-5 border border-white/20">
              <h2 className="text-lg font-bold text-white mb-2">💎 Choose Your Service Plan</h2>
              <p className="text-white/70 text-sm mb-4">Select the plan that fits your business needs</p>

              <div className="space-y-3">
                {SERVICE_PLANS.map((plan) => (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => update("servicePlan", plan.id)}
                    className={`w-full p-4 rounded-xl border-2 transition-all text-left relative ${
                      form.servicePlan === plan.id
                        ? "border-[#FFD700] bg-white/15 shadow-lg"
                        : "border-white/20 bg-white/5 hover:border-white/40"
                    } ${"recommended" in plan && plan.recommended ? "ring-2 ring-[#FFD700]/50" : ""}`}
                  >
                    {"recommended" in plan && plan.recommended && (
                      <span className="absolute -top-2 right-3 bg-[#FFD700] text-[#0A2569] text-xs font-bold px-2 py-0.5 rounded-full">
                        RECOMMENDED
                      </span>
                    )}

                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <span className="text-lg font-bold text-white">{plan.name}</span>
                        <span className="text-white/60 text-sm ml-2">{plan.subtitle}</span>
                      </div>
                      <span className="text-lg font-bold" style={{ color: plan.color }}>
                        {plan.price}
                      </span>
                    </div>

                    <ul className="space-y-1">
                      {plan.features.map((f, i) => (
                        <li key={i} className="text-xs text-white/70 flex items-center gap-1.5">
                          <span className="text-green-400">✓</span> {f}
                        </li>
                      ))}
                    </ul>

                    {form.servicePlan === plan.id && (
                      <div className="absolute top-3 left-3 w-5 h-5 bg-[#FFD700] rounded-full flex items-center justify-center">
                        <span className="text-[#0A2569] text-xs font-bold">✓</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleBack}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-lg transition-all border border-white/20"
              >
                ← Back
              </button>
              <button
                onClick={handleNext}
                className="flex-1 bg-[#FFD700] hover:bg-[#F59E0B] active:scale-95 text-[#0A2569] font-bold py-3 rounded-lg transition-all"
              >
                Next: Category →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Business Category */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="bg-white/10 rounded-xl p-5 border border-white/20">
              <h2 className="text-lg font-bold text-white mb-2">🏢 Business Category</h2>
              <p className="text-white/70 text-sm mb-4">
                This determines your default settings and available features
              </p>

              <div className="space-y-3">
                {BUSINESS_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => update("businessCategory", cat.id)}
                    className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                      form.businessCategory === cat.id
                        ? "border-[#FFD700] bg-white/15 shadow-lg"
                        : "border-white/20 bg-white/5 hover:border-white/40"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-3xl">{cat.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-white">{cat.name}</span>
                          {form.businessCategory === cat.id && (
                            <span className="w-5 h-5 bg-[#FFD700] rounded-full flex items-center justify-center">
                              <span className="text-[#0A2569] text-xs font-bold">✓</span>
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-white/80">{cat.subtitle}</p>
                        <p className="text-xs text-white/60 mt-1">{cat.description}</p>
                        <p className="text-xs text-white/50 mt-1 italic">Examples: {cat.examples}</p>
                        {!cat.canChargeExpress && (
                          <p className="text-xs text-yellow-300 mt-2">
                            ℹ️ Express Pass charging disabled (Public service)
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Anti-Corruption Notice */}
            <div className="bg-[#FEF3C7] border-l-4 border-[#EF4444] p-4 rounded shadow-md">
              <div className="flex items-start gap-3">
                <span className="text-3xl leading-none">⚠️</span>
                <div>
                  <p className="font-extrabold text-gray-900 text-base uppercase tracking-wide">
                    Bawal ang Fixer at Under-the-Table!
                  </p>
                  <p className="text-gray-700 text-sm mt-1">
                    Lahat ng bayad ay digital. Walang cash transaction sa pila.
                  </p>
                </div>
              </div>
            </div>

            {/* Terms */}
            <div>
              <label className="flex items-center gap-2 text-white/90 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => {
                    setAgreed(e.target.checked);
                    if (errors.terms) setErrors((er) => ({ ...er, terms: "" }));
                  }}
                  className="w-4 h-4 rounded accent-[#FFD700]"
                />
                Sumasang-ayon ako sa Terms of Service
              </label>
              {errors.terms && <p className="text-red-400 text-xs mt-1">{errors.terms}</p>}
            </div>

            {/* Summary */}
            {(selectedPlan || selectedCategory) && (
              <div className="bg-white/10 rounded-xl p-4 border border-white/20">
                <h3 className="text-sm font-bold text-[#FFD700] mb-2">📋 Summary</h3>
                <div className="space-y-1 text-sm text-white/80">
                  <p><span className="text-white/50">Business:</span> {form.businessName || "—"}</p>
                  <p><span className="text-white/50">Plan:</span> {selectedPlan?.name} ({selectedPlan?.price})</p>
                  <p><span className="text-white/50">Category:</span> {selectedCategory?.icon} {selectedCategory?.name}</p>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleBack}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-lg transition-all border border-white/20"
              >
                ← Back
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 bg-[#FFD700] hover:bg-[#F59E0B] active:scale-95 text-[#0A2569] font-bold py-4 text-lg rounded-lg transition-all"
              >
                Create Account ✓
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-sm text-gray-400 mt-6">
          May account na?{" "}
          <a href="/login" className="text-[#FFD700] underline hover:text-[#F59E0B]">
            Mag-login dito
          </a>
        </p>
      </div>
    </div>
  );
};

/* Reusable field component */
const Field = ({
  label,
  value,
  onChange,
  placeholder,
  error,
  required,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  error?: string;
  required?: boolean;
  type?: string;
}) => (
  <div>
    <label className="block text-sm font-medium text-white/90 mb-1">
      {label} {required && <span className="text-red-400">*</span>}
    </label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
    />
    {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
  </div>
);

export default MerchantSignup;
