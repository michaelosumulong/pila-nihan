import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

interface Plan {
  name: string;
  price: string;
  period: string;
  color: "gray" | "blue" | "green" | "purple";
  features: string[];
  cta: string;
  disabled: boolean;
  badge?: string;
  planKey?: string;
}

const FOUNDING_TOTAL = 15;

export default function Pricing() {
  const navigate = useNavigate();
  const [foundingSold, setFoundingSold] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFoundingCount = async () => {
      try {
        const { data, error } = await supabase
          .from('merchants')
          .select('id')
          .eq('is_founding_merchant', true);

        if (!error && data) {
          const sold = Math.min(FOUNDING_TOTAL, data.length);
          setFoundingSold(sold);
          const remaining = Math.max(0, FOUNDING_TOTAL - sold);
          console.log('📊 Founding merchants:', sold, '/ Remaining slots:', remaining);
        } else {
          console.error('Error fetching founding count:', error);
        }
      } catch (err) {
        console.error('Error fetching founding count:', err);
      }
      setLoading(false);
    };

    fetchFoundingCount();
  }, []);

  const foundingRemaining = Math.max(0, FOUNDING_TOTAL - foundingSold);

  const claimFounding15 = () => {
    if (foundingRemaining === 0) return;
    const raw = localStorage.getItem("pila-merchant");
    if (!raw) {
      toast.error("Please log in as a merchant first.");
      navigate("/login");
      return;
    }
    try {
      const merchant = JSON.parse(raw);
      if (merchant.foundingLifetime) {
        toast.info("You already hold a Founding 15 lifetime pass.");
        return;
      }
      const nextNumber = foundingSold + 1;
      const seedBonus = 500;
      const updated = {
        ...merchant,
        current_plan: "SINAG",
        servicePlan: "sinag",
        foundingLifetime: true,
        foundingMerchantNumber: merchant.foundingMerchantNumber || nextNumber,
        foundingBadge: "FOUNDING_15",
        lifetimePassPurchasedAt: new Date().toISOString(),
        prepaidCredits: (merchant.prepaidCredits || 0) + seedBonus,
      };
      localStorage.setItem("pila-merchant", JSON.stringify(updated));
      setFoundingSold(nextNumber);
      toast.success(
        `Welcome, Founding Merchant #${updated.foundingMerchantNumber}! ₱${seedBonus} wallet bonus credited.`
      );
      setTimeout(() => navigate("/dashboard"), 1200);
    } catch {
      toast.error("Could not read merchant profile.");
    }
  };

  const upgradeToSinagMonthly = () => {
    const raw = localStorage.getItem("pila-merchant");
    if (!raw) {
      navigate("/login");
      return;
    }
    navigate("/billing?plan=sinag");
  };

  const plans: Plan[] = [
    {
      name: "Free",
      price: "₱0",
      period: "Forever",
      color: "gray",
      features: [
        "Live queue management",
        "Call Next & Mark Served",
        "Wallet tracking",
        "30-day transaction history",
        "Mark No-Show",
      ],
      cta: "Current Plan",
      disabled: false,
      planKey: "panday",
    },
    {
      name: "Sinag Monthly",
      price: "₱999",
      period: "Per month",
      color: "blue",
      features: [
        "Everything in Free",
        "Full analytics dashboard",
        "Heatmaps & trends",
        "1-year transaction history",
        "Performance insights",
      ],
      cta: "Upgrade to Monthly",
      disabled: false,
      planKey: "sinag",
    },
    {
      name: "Founding 15 Lifetime",
      price: "₱4,999",
      period: "One-time",
      color: "green",
      features: [
        "Everything in Sinag",
        "LIFETIME access (no recurring fees)",
        "Founding Member badge",
        "Priority support",
        "₱500 wallet bonus",
        "Exclusive merchant community",
      ],
      cta:
        foundingRemaining === 0
          ? "Sold Out"
          : `Get Lifetime Access (${foundingRemaining} spots left!)`,
      disabled: foundingRemaining === 0,
      badge: "EXCLUSIVE",
    },
    {
      name: "Suri (Expert AI)",
      price: "TBA",
      period: "Coming Soon",
      color: "purple",
      features: [
        "Everything in Sinag",
        "AI-powered demand forecasting",
        "Smart staffing recommendations",
        "Predictive analytics",
        "Custom reports",
      ],
      cta: "Coming Soon",
      disabled: true,
    },
  ];

  const headerBg: Record<Plan["color"], string> = {
    gray: "bg-gray-50",
    blue: "bg-blue-50",
    green: "bg-green-50",
    purple: "bg-purple-50",
  };
  const ctaBg: Record<Plan["color"], string> = {
    gray: "bg-gray-500 text-white hover:bg-gray-600",
    blue: "bg-blue-500 text-white hover:bg-blue-600",
    green: "bg-green-500 text-white hover:bg-green-600",
    purple: "bg-purple-500 text-white hover:bg-purple-600",
  };

  const onCta = (plan: Plan) => {
    if (plan.disabled) return;
    if (plan.name === "Founding 15 Lifetime") {
      claimFounding15();
    } else if (plan.name === "Sinag Monthly") {
      upgradeToSinagMonthly();
    } else if (plan.name === "Free") {
      toast.info("You're on the Free plan.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-gray-600 font-medium">Loading pricing...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-2">
          Simple, Transparent Pricing
        </h1>
        <p className="text-center text-gray-600 mb-12">
          Choose the plan that fits your business
        </p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {plans.map((plan, idx) => (
            <div
              key={idx}
              className={`bg-white rounded-lg shadow-lg overflow-hidden transition ${
                plan.color === "green" ? "ring-2 ring-green-500 md:scale-105" : ""
              }`}
            >
              {plan.badge && (
                <div className="bg-green-500 text-white text-center py-2 text-sm font-bold">
                  {plan.badge}
                </div>
              )}

              <div className={`${headerBg[plan.color]} p-6`}>
                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className="text-gray-600">{plan.period}</span>
                </div>
              </div>

              <div className="p-6 space-y-3">
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="p-6 border-t">
                <button
                  disabled={plan.disabled}
                  onClick={() => onCta(plan)}
                  className={`w-full py-3 rounded-lg font-bold transition ${
                    plan.disabled
                      ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                      : ctaBg[plan.color]
                  }`}
                >
                  {plan.disabled ? (
                    <div className="flex items-center justify-center gap-2">
                      <Lock className="w-4 h-4" />
                      {plan.cta}
                    </div>
                  ) : (
                    plan.cta
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 bg-green-50 border-2 border-green-500 rounded-lg p-8 text-center">
          <h3 className="text-2xl font-bold mb-2">🚀 Join the Founding 15</h3>
          <p className="text-gray-700 mb-4">
            Only {foundingRemaining} lifetime passes remaining! Lock in
            permanent, zero-monthly-fee access to all Sinag features. Get
            instant ₱500 wallet bonus.
          </p>
          <p className="text-sm text-gray-600">
            Early supporters of Pilanihan get lifetime benefits. After 15 sales,
            this offer expires forever.
          </p>
        </div>
      </div>
    </div>
  );
}
