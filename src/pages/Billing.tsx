import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Zap, Crown, AlertCircle, CreditCard, Shield, Plus } from "lucide-react";
import { toast } from "sonner";
import { useBranding } from "@/contexts/BrandingContext";
import PilaLogo from "@/components/PilaLogo";
import VersionFooter from "@/components/VersionFooter";

const PLANS = [
  {
    id: "panday",
    name: "PANDAY",
    subtitle: "Standard",
    price: 0,
    color: "gray",
    icon: Shield,
    features: [
      "Basic queue management",
      "Ticket generation & tracking",
      "Real-time queue display",
      "30-day history",
      "Basic statistics",
      "Email support",
    ],
  },
  {
    id: "sinag",
    name: "SINAG",
    subtitle: "Insight",
    price: 999,
    color: "amber",
    icon: Zap,
    popular: true,
    features: [
      "Everything in PANDAY",
      "Peak hour forecasting",
      "Custom branding & logo",
      "1-year history",
      "Advanced analytics dashboard",
      "Customer heatmaps",
      "Priority email support",
    ],
  },
  {
    id: "suri",
    name: "SURI",
    subtitle: "Expert AI",
    price: 3499,
    color: "purple",
    icon: Crown,
    features: [
      "Everything in SINAG",
      "AI root cause analysis",
      "Automated DMAIC recommendations",
      "Takt Time optimization",
      "Muda (waste) detection",
      "Accountability Shield (AI adoption tracking)",
      "White-labeling options",
      "Priority phone support",
      "Dedicated success manager",
    ],
  },
];

export default function Billing() {
  const navigate = useNavigate();
  const { branding, customLogo } = useBranding();
  const [merchant, setMerchant] = useState<any>(null);

  useEffect(() => {
    const savedMerchant = JSON.parse(localStorage.getItem("pila-merchant") || "{}");
    setMerchant(savedMerchant);
  }, []);

  const currentPlan = PLANS.find((p) => p.id === (merchant?.servicePlan || "panday"));
  const currentPrice = currentPlan?.price || 0;
  const vatAmount = currentPrice * 0.12;
  const totalDue = currentPrice + vatAmount;

  const handleUpgrade = (planId: string) => {
    const targetPlan = PLANS.find((p) => p.id === planId);
    if (!targetPlan) return;

    if (planId === merchant?.servicePlan) {
      toast.info("You are already on this plan");
      return;
    }

    const planHierarchy: Record<string, number> = { panday: 0, sinag: 1, suri: 2 };
    const currentLevel = planHierarchy[merchant?.servicePlan || "panday"] || 0;
    const targetLevel = planHierarchy[planId] || 0;

    if (targetLevel < currentLevel) {
      if (!window.confirm(`Are you sure you want to downgrade to ${targetPlan.name}? You will lose access to premium features.`)) {
        return;
      }
    }

    const updatedMerchant = { ...merchant, servicePlan: planId };
    localStorage.setItem("pila-merchant", JSON.stringify(updatedMerchant));
    setMerchant(updatedMerchant);

    toast.success(`${targetLevel > currentLevel ? "Upgraded" : "Switched"} to ${targetPlan.name}!`, {
      description: "Your new features are now active",
    });

    setTimeout(() => window.location.reload(), 1500);
  };

  if (!merchant) return null;

  return (
    <div className="min-h-screen pb-6">
      <div className="max-w-5xl mx-auto px-4 py-6">

        {/* Current Plan Summary */}
        <div className="bg-white rounded-xl p-6 shadow-xl mb-8 border-4 border-[#FFB703]">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              {currentPlan && (
                <div
                  className={`w-14 h-14 rounded-lg flex items-center justify-center ${
                    currentPlan.color === "amber"
                      ? "bg-amber-100"
                      : currentPlan.color === "purple"
                      ? "bg-purple-100"
                      : "bg-gray-100"
                  }`}
                >
                  <currentPlan.icon
                    className={
                      currentPlan.color === "amber"
                        ? "text-amber-600"
                        : currentPlan.color === "purple"
                        ? "text-purple-600"
                        : "text-gray-600"
                    }
                    size={28}
                  />
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500 font-semibold">Current Plan</p>
                <h2 className="text-2xl font-black text-gray-900">
                  {currentPlan?.name}
                  <span className="text-base text-gray-500 font-normal ml-2">
                    {currentPlan?.subtitle}
                  </span>
                </h2>
              </div>
            </div>
            {currentPlan?.id !== "suri" && (
              <button
                onClick={() => document.getElementById("plans")?.scrollIntoView({ behavior: "smooth" })}
                className="px-5 py-2.5 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 flex items-center gap-2 shadow-lg text-sm"
              >
                <Zap size={16} /> Upgrade Plan
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Billing breakdown */}
            <div className="space-y-3 bg-gray-50 rounded-lg p-4">
              <h3 className="font-bold text-gray-900 text-sm">Monthly Billing</h3>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subscription:</span>
                <span className="font-bold">₱{currentPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">VAT (12%):</span>
                <span className="font-semibold text-gray-700">₱{vatAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-black border-t pt-3">
                <span>Total Due:</span>
                <span className="text-green-600">₱{totalDue.toLocaleString()}</span>
              </div>
              {currentPrice === 0 ? (
                <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm text-green-800 font-semibold text-center">
                    ✓ Free Plan — No payment required
                  </p>
                </div>
              ) : (
                <button className="w-full mt-3 px-4 py-2.5 bg-gray-900 text-white rounded-lg font-bold hover:bg-gray-800 flex items-center justify-center gap-2 text-sm">
                  <CreditCard size={16} /> Update Payment Method
                </button>
              )}
            </div>

            {/* Policy */}
            <div className="bg-gray-900 rounded-lg p-4 text-white">
              <h3 className="font-bold mb-3 flex items-center gap-2 text-sm">
                <AlertCircle size={16} /> Billing Policy
              </h3>
              <ul className="space-y-2 text-xs">
                <li className="flex items-start gap-2">
                  <Check size={14} className="text-green-400 mt-0.5 flex-shrink-0" />
                  <span>VAT (12%) exclusive on Priority Upgrades</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={14} className="text-green-400 mt-0.5 flex-shrink-0" />
                  <span>60/40 Revenue split on Express Passes (60% Platform, 40% Merchant)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={14} className="text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Monthly billing cycle, cancel anytime</span>
                </li>
                <li className="flex items-start gap-2 text-yellow-400">
                  <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                  <span>Data Restore Fee: ₱2,000 for historical logs (PANDAY/SINAG)</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Prepaid Credits Management */}
        <div className="bg-white rounded-xl p-6 shadow-xl mb-8 border-2 border-green-500">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-lg bg-green-100 flex items-center justify-center">
                <CreditCard className="text-green-600" size={32} />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-semibold mb-1">Prepaid Credits</p>
                <h2 className="text-3xl font-black text-gray-900">
                  ₱{(merchant?.prepaidCredits || 0).toLocaleString()}
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Available for Express Pass features
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                toast.info('GCash/Maya Integration Coming Soon', {
                  description: 'For beta, credits are simulated'
                });
              }}
              className="px-6 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 flex items-center gap-2 shadow-lg"
            >
              <Plus size={18} />
              Top Up Credits
            </button>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-bold text-gray-900 mb-3 text-sm">What are Prepaid Credits?</h3>
            <p className="text-sm text-gray-700 mb-3">
              Prepaid credits are used to fund the merchant's share (40%) of Express Pass revenue.
              When customers purchase Express Pass priority, 60% goes to Pila-nihan platform and 40%
              goes to your merchant account from your prepaid balance.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button className="p-3 bg-white rounded-lg border-2 border-gray-200 hover:border-green-500 transition-colors">
                <p className="text-2xl font-bold text-gray-900">₱500</p>
                <p className="text-xs text-gray-500">Quick Top-Up</p>
              </button>
              <button className="p-3 bg-white rounded-lg border-2 border-gray-200 hover:border-green-500 transition-colors">
                <p className="text-2xl font-bold text-gray-900">₱1,000</p>
                <p className="text-xs text-gray-500">Standard</p>
              </button>
              <button className="p-3 bg-white rounded-lg border-2 border-gray-200 hover:border-green-500 transition-colors">
                <p className="text-2xl font-bold text-gray-900">₱5,000</p>
                <p className="text-xs text-gray-500">Business</p>
              </button>
            </div>
          </div>
        </div>

        {/* Plan Comparison */}
        <div id="plans" className="mb-8">
          <h2 className="text-xl font-bold text-white mb-6">Choose Your Plan</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLANS.map((plan) => {
              const isCurrent = plan.id === (merchant?.servicePlan || "panday");
              const PlanIcon = plan.icon;
              return (
                <div
                  key={plan.id}
                  className={`relative rounded-xl p-6 transition-all ${
                    isCurrent
                      ? "bg-white border-4 border-[#FFB703] shadow-2xl"
                      : "bg-white border-2 border-gray-200 shadow-lg hover:shadow-xl"
                  } ${plan.popular ? "md:scale-105" : ""}`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white px-4 py-1 rounded-full text-xs font-black shadow-lg">
                      ⭐ MOST POPULAR
                    </div>
                  )}
                  {isCurrent && (
                    <div className="absolute top-3 right-3 bg-green-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                      ✓ CURRENT
                    </div>
                  )}
                  <div className="mb-5">
                    <div
                      className={`inline-flex p-3 rounded-lg mb-3 ${
                        plan.color === "amber"
                          ? "bg-amber-100"
                          : plan.color === "purple"
                          ? "bg-purple-100"
                          : "bg-gray-100"
                      }`}
                    >
                      <PlanIcon
                        className={
                          plan.color === "amber"
                            ? "text-amber-600"
                            : plan.color === "purple"
                            ? "text-purple-600"
                            : "text-gray-600"
                        }
                        size={28}
                      />
                    </div>
                    <h3 className="text-xl font-black text-gray-900">{plan.name}</h3>
                    <p className="text-sm text-gray-500">{plan.subtitle}</p>
                    <div className="flex items-baseline gap-1 mt-3">
                      <span className="text-3xl font-black text-gray-900">
                        ₱{plan.price.toLocaleString()}
                      </span>
                      <span className="text-gray-500 text-sm">/mo</span>
                    </div>
                    {plan.price > 0 && (
                      <p className="text-xs text-gray-400 mt-1">+ ₱{(plan.price * 0.12).toFixed(2)} VAT</p>
                    )}
                  </div>
                  <ul className="space-y-2 mb-6 min-h-[200px]">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <Check size={14} className="text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={isCurrent}
                    className={`w-full py-3 rounded-lg font-bold text-sm transition-all ${
                      isCurrent
                        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                        : plan.color === "purple"
                        ? "bg-purple-600 text-white hover:bg-purple-700 shadow-lg"
                        : plan.color === "amber"
                        ? "bg-amber-500 text-white hover:bg-amber-600 shadow-lg"
                        : "bg-gray-800 text-white hover:bg-gray-900 shadow-lg"
                    }`}
                  >
                    {isCurrent ? "✓ Current Plan" : `Switch to ${plan.name}`}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Founding Merchant Discount */}
        {merchant?.foundingMerchantNumber && merchant.foundingMerchantNumber <= 50 && (
          <div className="bg-purple-900 rounded-xl p-6 text-white mb-8 border-4 border-purple-600">
            <div className="flex items-start gap-4">
              <Crown className="text-yellow-400 flex-shrink-0" size={28} />
              <div>
                <h3 className="text-lg font-bold mb-1">
                  🏆 Founding Merchant #{merchant.foundingMerchantNumber}
                </h3>
                <p className="text-purple-200 text-sm mb-2">
                  Exclusive lifetime access to SURI features at{" "}
                  <strong>₱1,499/mo</strong> (57% off regular price).
                </p>
                <p className="text-xs text-purple-300">
                  This special pricing is locked in for as long as you maintain your subscription.
                </p>
              </div>
            </div>
          </div>
        )}

        <VersionFooter />
      </div>
    </div>
  );
}
