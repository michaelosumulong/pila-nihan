import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Store, Mail, Key } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [shopCode, setShopCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanEmail = email.toLowerCase().trim();
    const cleanCode = shopCode.toUpperCase().trim();

    if (!cleanEmail || !cleanCode) {
      toast.error("Please enter both email and shop code");
      return;
    }

    setIsLoading(true);
    console.log("════════════════════════════════════════");
    console.log("🔄 LOGIN INITIATED");
    console.log("════════════════════════════════════════");

    try {
      console.log("📧 Email:", cleanEmail);
      console.log("🏪 Shop Code:", cleanCode);

      console.log("🔍 Querying Supabase for merchant...");
      const { data, error } = await supabase
        .from("merchants")
        .select("*")
        .eq("email", cleanEmail)
        .eq("shop_code", cleanCode)
        .single();

      if (error) {
        console.error("❌ Supabase query error:", error);
        toast.error("Invalid email or shop code. Please check and try again.");
        setIsLoading(false);
        return;
      }

      if (!data) {
        console.error("❌ No merchant found");
        toast.error("Merchant not found. Please check and try again.");
        setIsLoading(false);
        return;
      }

      console.log("✅ Merchant found in database");
      console.log("   ID:", data.id);
      console.log("   Business:", data.business_name);

      const merchantSession = {
        id: data.id,
        businessName: data.business_name,
        shopCode: data.shop_code,
        ownerName: data.owner_name,
        email: data.email,
        mobile: data.mobile,
        businessCategory: data.business_category,
        servicePlan: data.service_plan,
        current_plan: data.current_plan || "FREE",
        is_founding_merchant: data.is_founding_merchant || false,
        wallet_balance: data.wallet_balance ?? 0,
        founding_merchant_number: data.founding_merchant_number ?? null,
        prepaidCredits: data.prepaid_credits || 500,
      };
      console.log("💳 Loaded plan from DB:", merchantSession.current_plan, "Founding:", merchantSession.is_founding_merchant);

      console.log("");
      console.log("════════════════════════════════════════");
      console.log("💾 SAVING MERCHANT SESSION");
      console.log("════════════════════════════════════════");

      localStorage.setItem("pila-merchant", JSON.stringify(merchantSession));
      console.log("✅ localStorage.setItem() executed");

      const verify = localStorage.getItem("pila-merchant");

      if (!verify) {
        console.error("❌ CRITICAL: localStorage returned null after setItem!");
        console.error("   This usually means localStorage is disabled or quota exceeded");
        toast.error("Session storage failed. Check browser settings.");
        setIsLoading(false);
        return;
      }

      const verifyParsed = JSON.parse(verify);
      console.log("✅ Verified in localStorage: " + verifyParsed.businessName);
      console.log("   Merchant UUID:", verifyParsed.id);
      console.log("   Shop Code:", verifyParsed.shopCode);

      if (verifyParsed.id !== data.id) {
        console.error("❌ Data mismatch! Stored ID does not match database ID");
        toast.error("Session data mismatch. Please try again.");
        setIsLoading(false);
        return;
      }

      window.dispatchEvent(new Event("merchant-updated"));

      console.log("");
      console.log("════════════════════════════════════════");
      console.log("✅ SESSION LOCK COMPLETE");
      console.log("════════════════════════════════════════");
      console.log("Proceeding to dashboard...");
      console.log("════════════════════════════════════════");

      setIsLoading(false);
      toast.success(`Welcome back, ${data.business_name}!`);
      navigate("/dashboard");
    } catch (err: any) {
      console.error("❌ Login exception:", err);
      console.error("Stack:", err?.stack);
      toast.error("Login failed: " + (err?.message || "Unknown error"));
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A2569] p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#0A2569] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Store className="text-[#FFB703]" size={32} />
          </div>
          <h1 className="text-2xl font-black text-[#0A2569]">Merchant Login</h1>
          <p className="text-sm text-gray-600 mt-1">
            Secure access to your queue dashboard
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <Label htmlFor="email" className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
              <Mail size={14} /> Email Address
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full mt-1"
              autoComplete="email"
              required
            />
          </div>

          <div>
            <Label htmlFor="shopCode" className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
              <Key size={14} /> Shop Code
            </Label>
            <Input
              id="shopCode"
              value={shopCode}
              onChange={(e) => setShopCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
              placeholder="TESTSHOP"
              className="w-full text-lg font-mono uppercase tracking-wider mt-1"
              maxLength={12}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              8-character code from your signup confirmation
            </p>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#FFB703] hover:bg-[#FF8C00] text-[#0A2569] font-bold py-6 text-base"
          >
            {isLoading ? "Verifying..." : "Access Dashboard"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{" "}
            <button
              type="button"
              onClick={() => navigate("/signup")}
              className="text-[#0A2569] font-semibold hover:underline"
            >
              Sign up here
            </button>
          </p>
        </div>

        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-xs text-amber-800 text-center">
            🔒 Two-factor security: Email + Shop Code verification prevents unauthorized access
          </p>
        </div>
      </div>
    </div>
  );
}
