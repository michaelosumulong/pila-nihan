import { useNavigate } from "react-router-dom";

const plans = [
  {
    name: "PANDAY",
    tagline: "Free Forever",
    price: "₱0",
    period: "/mo",
    features: [
      "Up to 30 customers/day",
      "Basic queue management",
      "QR code + shop code",
      "Real-time notifications",
      "Customer feedback",
    ],
    missing: ["Analytics dashboard", "Suri quality audits", "Priority support", "Custom branding"],
    cta: "Start Free",
    popular: false,
    bg: "bg-white",
    border: "border-gray-200",
  },
  {
    name: "SINAG",
    tagline: "Growth Plan",
    price: "₱999",
    period: "/mo",
    features: [
      "Unlimited customers",
      "Full queue management",
      "QR code + shop code",
      "Real-time notifications",
      "Customer feedback",
      "Analytics dashboard",
      "Express queue upgrades",
      "Email support",
    ],
    missing: ["Suri quality audits", "Custom branding"],
    cta: "Start Trial",
    popular: true,
    bg: "bg-gradient-to-br from-blue-50 to-white",
    border: "border-primary",
  },
  {
    name: "SURI",
    tagline: "Six Sigma AI",
    price: "₱3,499",
    period: "/mo",
    features: [
      "Everything in SINAG",
      "Suri quality audits (AI)",
      "5 Whys root cause analysis",
      "Muda waste detection",
      "Sigma level tracking",
      "Custom branding",
      "Priority support",
      "API access",
    ],
    missing: [],
    cta: "Contact Sales",
    popular: false,
    bg: "bg-gradient-to-br from-yellow-50 to-white",
    border: "border-yellow-400",
  },
];

const PricingTable = () => {
  const navigate = useNavigate();

  return (
    <div className="py-12">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Simple, Transparent Pricing</h2>
        <p className="text-gray-600">No hidden fees. No contracts. Cancel anytime.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`${plan.bg} rounded-2xl shadow-lg p-6 border-2 ${plan.border} relative ${
              plan.popular ? "scale-105 shadow-2xl" : ""
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-xs font-bold">
                MOST POPULAR
              </div>
            )}
            <div className="text-center mb-6">
              <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
              <p className="text-sm text-gray-500">{plan.tagline}</p>
              <div className="mt-3">
                <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                <span className="text-gray-500">{plan.period}</span>
              </div>
            </div>

            <ul className="space-y-2 mb-6">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="text-green-500 flex-shrink-0">✓</span> {f}
                </li>
              ))}
              {plan.missing.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-gray-400">
                  <span className="flex-shrink-0">—</span> {f}
                </li>
              ))}
            </ul>

            <button
              onClick={() => navigate("/signup")}
              className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${
                plan.popular
                  ? "bg-primary text-primary-foreground hover:brightness-90"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {plan.cta}
            </button>
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-gray-400 mt-6">
        All prices exclusive of 12% VAT • Beta merchants get 2 months free on any plan
      </p>
    </div>
  );
};

export default PricingTable;
