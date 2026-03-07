import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const CATEGORIES = [
  { value: "", label: "Pumili ng kategorya..." },
  { value: "LINGKOD", label: "LINGKOD (Government Office)" },
  { value: "SULONG", label: "SULONG (Small Business)" },
  { value: "AGOS", label: "AGOS (Commercial)" },
];

const MerchantSignup = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    businessName: "",
    ownerName: "",
    mobile: "",
    category: "",
    address: "",
    email: "",
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

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.businessName.trim()) e.businessName = "Kinakailangan";
    if (!form.ownerName.trim()) e.ownerName = "Kinakailangan";
    if (!form.mobile.trim()) e.mobile = "Kinakailangan";
    if (!form.category) e.category = "Kinakailangan";
    if (!form.address.trim()) e.address = "Kinakailangan";
    if (!agreed) e.terms = "Kailangan mong sumang-ayon";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    // Generate shop code from business name
    const shopCode = form.businessName
      .toUpperCase()
      .replace(/[^A-Z]/g, "")
      .substring(0, 6)
      .padEnd(6, "X");

    const data = {
      id: `MERCH-${Date.now()}`,
      businessName: form.businessName,
      ownerName: form.ownerName,
      mobile: form.mobile,
      category: form.category,
      address: form.address,
      email: form.email,
      location: location || { lat: 14.5995, lng: 120.9842 },
      shopCode,
      plan: "PANDAY",
      wallet: { balance: 0, credits: 500 },
      joinedDate: new Date().toISOString(),
    };

    localStorage.setItem("pila-merchant", JSON.stringify(data));
    console.log("Merchant saved:", data);
    setTimeout(() => navigate("/dashboard"), 100);
  };

  // Generate bunting triangles
  const buntingCount = 24;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#002366] to-[#1E5AA8]">
      {/* Bunting */}
      <div className="bunting pt-2 pb-1">
        {Array.from({ length: buntingCount }).map((_, i) => (
          <div key={i} className="bunting-triangle" />
        ))}
      </div>

      <div className="max-w-md mx-auto px-5 pb-10">
        {/* Logo */}
        <div className="flex flex-col items-center pt-8 pb-6">
          <div className="w-32 h-32 bg-[#3B82F6] rounded-2xl flex items-center justify-center logo-glow mb-4">
            <span className="text-6xl">🎫</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-wide">PILA-NIHAN™</h1>
          <p className="text-[#FFD700] italic text-lg mt-1">Ginhawa sa Bawat Pila</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
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

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-white/90 mb-1">
              Category <span className="text-red-400">*</span>
            </label>
            <select
              value={form.category}
              onChange={(e) => update("category", e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-[#FFD700] appearance-none"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value} className="text-gray-900">
                  {c.label}
                </option>
              ))}
            </select>
            {errors.category && <p className="text-red-400 text-xs mt-1">{errors.category}</p>}
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-white/90 mb-1">
              Address <span className="text-red-400">*</span>
            </label>
            <textarea
              value={form.address}
              onChange={(e) => update("address", e.target.value)}
              placeholder="123 Barangay St, Manila"
              rows={3}
              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#FFD700] resize-none"
            />
            {errors.address && <p className="text-red-400 text-xs mt-1">{errors.address}</p>}
            <div className="text-sm mt-2">
              {location ? (
                <span className="text-green-400">
                  ✓ Location captured: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                </span>
              ) : (
                <span className="text-yellow-400">
                  ⚠️ {locationError || "Getting location..."}
                </span>
              )}
            </div>
          </div>

          <Field
            label="Email"
            value={form.email}
            onChange={(v) => update("email", v)}
            placeholder="nena@example.com"
            type="email"
          />

          {/* Anti-Corruption Notice */}
          <div className="bg-[#FEF3C7] border-l-4 border-[#EF4444] p-4 rounded shadow-md">
            <div className="flex items-start gap-3">
              <span className="text-3xl leading-none">⚠️</span>
              <div>
                <p className="font-extrabold text-gray-900 text-base uppercase tracking-wide">Bawal ang Fixer at Under-the-Table!</p>
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

          {/* Submit */}
          <button
            type="submit"
            className="w-full bg-[#FFD700] hover:bg-[#F59E0B] active:scale-95 text-white font-bold py-4 text-lg rounded-lg transition-all"
          >
            MAGPATULOY
          </button>
        </form>

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
