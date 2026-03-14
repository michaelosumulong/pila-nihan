import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import PilaLogo from "@/components/PilaLogo";

const Login = () => {
  const navigate = useNavigate();
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const savedMerchant = localStorage.getItem("pila-merchant");
    if (savedMerchant) {
      toast.success("Welcome back!");
      navigate("/dashboard");
    } else {
      toast.error("Account not found. Please sign up first.");
    }
  };

  const buntingCount = 24;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#002366] to-[#1E5AA8]">
      <div className="bunting pt-2 pb-1">
        {Array.from({ length: buntingCount }).map((_, i) => (
          <div key={i} className="bunting-triangle" />
        ))}
      </div>

      <div className="max-w-md mx-auto px-5 pb-10">
        <div className="flex flex-col items-center pt-8 pb-6">
          <PilaLogo className="w-32 h-32 mb-4" />
          <h1 className="text-3xl font-bold text-primary tracking-wide">Merchant Login</h1>
          <p className="text-[#FFD700] italic text-lg mt-1">Ginhawa sa Bawat Pila</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
              <input
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="+63 917 123 4567"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#FFD700] hover:bg-[#F59E0B] text-white font-bold py-3 text-lg rounded-lg uppercase"
            >
              MAGPATULOY
            </button>
          </form>
        </div>

        <div className="bg-[#FEF3C7] border-l-4 border-[#EF4444] p-4 rounded shadow-md mt-6">
          <div className="flex items-start gap-3">
            <span className="text-3xl leading-none">⚠️</span>
            <div>
              <p className="font-extrabold text-gray-900 text-base uppercase tracking-wide">Bawal ang Fixer at Under-the-Table!</p>
              <p className="text-gray-700 text-sm mt-1">Lahat ng bayad ay digital. Walang cash transaction sa pila.</p>
            </div>
          </div>
        </div>

        <p className="text-center text-sm text-gray-400 mt-6">
          Wala pang account?{" "}
          <a href="/signup" className="text-[#3B82F6] underline hover:text-[#2563EB]">
            Mag-sign up dito
          </a>
        </p>
      </div>
    </div>
  );
};

export default Login;
