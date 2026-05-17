import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Store } from "lucide-react";

export default function Login() {
  const [shopCode, setShopCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const code = shopCode.toUpperCase().trim();
    if (!code) {
      toast.error("Please enter your shop code");
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from("merchants")
        .select("*")
        .eq("shop_code", code)
        .single();

      if (error || !data) {
        toast.error("Shop code not found. Please check and try again.");
        setIsLoading(false);
        return;
      }

      const merchantSession = {
        id: data.id,
        businessName: data.business_name,
        shopCode: data.shop_code,
        ownerName: data.owner_name,
        email: data.email,
        mobile: data.mobile,
        businessCategory: data.business_category,
        servicePlan: data.service_plan,
        prepaidCredits: data.prepaid_credits ?? 500,
      };

      localStorage.setItem("pila-merchant", JSON.stringify(merchantSession));
      window.dispatchEvent(new Event("merchant-updated"));

      toast.success(`Welcome back, ${data.business_name}!`);
      navigate("/dashboard");
    } catch (err) {
      console.error("Login error:", err);
      toast.error("Login failed. Please try again.");
    } finally {
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
            Enter your shop code to access your dashboard
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <Label htmlFor="shopCode" className="text-sm font-semibold text-gray-700">
              Shop Code
            </Label>
            <Input
              id="shopCode"
              value={shopCode}
              onChange={(e) => setShopCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
              placeholder="TESTSHOP"
              className="w-full text-lg uppercase tracking-wider mt-1"
              maxLength={12}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter the shop code you received during signup
            </p>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#FFB703] hover:bg-[#FF8C00] text-[#0A2569] font-bold py-6 text-base"
          >
            {isLoading ? "Logging in..." : "Access Dashboard"}
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
            🔒 Simple & secure: Shop code access for MVP. Password login can be added later.
          </p>
        </div>
      </div>
    </div>
  );
}
