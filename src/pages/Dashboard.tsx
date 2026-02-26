import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface MerchantData {
  id: string;
  businessName: string;
  ownerName: string;
  mobile: string;
  category: string;
  address: string;
  email: string;
  plan: string;
  wallet: { balance: number; credits: number };
  joinedDate: string;
}

const CATEGORY_MAP: Record<string, { label: string; bg: string; text: string }> = {
  LINGKOD: { label: "Government", bg: "bg-purple-100", text: "text-purple-800" },
  SULONG: { label: "Small Business", bg: "bg-green-100", text: "text-green-800" },
  AGOS: { label: "Commercial", bg: "bg-blue-100", text: "text-blue-800" },
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [merchant, setMerchant] = useState<MerchantData | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem("pila-merchant");
    if (!raw) {
      navigate("/");
      return;
    }
    try {
      setMerchant(JSON.parse(raw));
    } catch {
      navigate("/");
    }
  }, [navigate]);

  if (!merchant) return null;

  const cat = CATEGORY_MAP[merchant.category] || { label: merchant.category, bg: "bg-gray-100", text: "text-gray-800" };
  const isSuriVerified = ["PANDAY"].includes(merchant.plan);
  const buntingCount = 24;

  return (
    <div className="min-h-screen bg-gray-100 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] relative">
        {/* Bunting */}
        <div className="bunting pt-2 pb-1">
          {Array.from({ length: buntingCount }).map((_, i) => (
            <div key={i} className="bunting-triangle" />
          ))}
        </div>

        <div className="flex items-center justify-between px-5 pt-3 pb-6">
          <button onClick={() => setMenuOpen(!menuOpen)} className="text-white text-2xl">☰</button>
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-[#3B82F6] rounded-xl flex items-center justify-center logo-glow mb-1">
              <span className="text-3xl">🎫</span>
            </div>
            <h1 className="text-xl font-bold text-white">Dashboard</h1>
          </div>
          <button className="relative text-white text-2xl">
            🔔
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-[#2563EB]" />
          </button>
        </div>

        {/* Welcome */}
        <div className="px-6 pb-8">
          <p className="text-white text-xl">
            Maligayang araw, <span className="font-bold">{merchant.businessName}</span>!
          </p>
          {/* Category + Integrity Badge */}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-white/70 text-sm">Category:</span>
            <span className={`${cat.bg} ${cat.text} text-xs font-semibold px-2.5 py-0.5 rounded-full`}>
              {cat.label}
            </span>
            {isSuriVerified && (
              <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                🛡️ Suri-Verified
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Content - pulls up into header */}
      <div className="px-6 -mt-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <StatCard icon="👥" value="24" label="Sa Pila Ngayon" valueColor="text-[#1E3A8A]" />
          <StatCard icon="✅" value="158" label="Naserve Today" valueColor="text-[#10B981]" />
          <StatCard
            icon="💰"
            value={`₱${merchant.wallet.balance.toLocaleString()}`}
            label="Wallet Balance"
            valueColor="text-[#FFB703]"
            smaller
          />
          <StatCard
            icon="🎟️"
            value={`₱${merchant.wallet.credits.toLocaleString()}`}
            label="Prepaid Credits"
            valueColor="text-[#3B82F6]"
            smaller
          />
        </div>

        {/* Quick Actions */}
        <div className="flex gap-3 overflow-x-auto pb-1 mb-6 scrollbar-hide">
          <ActionButton icon="📢" label="Call Next" bg="bg-[#10B981]" />
          <ActionButton icon="👀" label="View Queue" bg="bg-[#3B82F6]" />
          <ActionButton icon="⚙️" label="Settings" bg="bg-[#6B7280]" />
        </div>

        {/* Announcement */}
        <div className="bg-[#FFF9E6] border-l-4 border-[#FFB703] p-4 rounded-lg mb-6">
          <p className="text-sm text-gray-800">
            🔔 Welcome to Pila-nihan! Your queue system is ready.
          </p>
        </div>
      </div>

      {/* Slide-out Menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMenuOpen(false)} />
          <div className="relative w-64 bg-white h-full shadow-xl p-6 z-10 animate-in slide-in-from-left">
            <h2 className="text-lg font-bold mb-4">Menu</h2>
            <p className="text-sm text-gray-500">{merchant.ownerName}</p>
            <p className="text-xs text-gray-400 mb-6">{merchant.mobile}</p>
            <nav className="space-y-3 text-sm">
              <p className="cursor-pointer hover:text-blue-600">🏠 Dashboard</p>
              <p className="cursor-pointer hover:text-blue-600">📋 Queue</p>
              <p className="cursor-pointer hover:text-blue-600">💰 Wallet</p>
              <p className="cursor-pointer hover:text-blue-600">⚙️ Settings</p>
              <p className="cursor-pointer hover:text-red-600 text-red-500 mt-6" onClick={() => { localStorage.removeItem("pila-merchant"); navigate("/"); }}>
                🚪 Logout
              </p>
            </nav>
          </div>
        </div>
      )}

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around py-3 z-40">
        <NavTab icon="🏠" label="Dashboard" active />
        <NavTab icon="📋" label="Queue" />
        <NavTab icon="💰" label="Wallet" />
        <NavTab icon="⚙️" label="Settings" />
      </div>
    </div>
  );
};

const StatCard = ({ icon, value, label, valueColor, smaller }: {
  icon: string; value: string; label: string; valueColor: string; smaller?: boolean;
}) => (
  <div className="bg-white rounded-2xl shadow-lg p-5">
    <span className="text-2xl">{icon}</span>
    <p className={`${smaller ? "text-2xl" : "text-3xl"} font-bold ${valueColor} mt-1`}>{value}</p>
    <p className="text-sm text-gray-600">{label}</p>
  </div>
);

const ActionButton = ({ icon, label, bg }: { icon: string; label: string; bg: string }) => (
  <button className={`${bg} text-white rounded-xl px-6 py-3 flex items-center gap-2 whitespace-nowrap font-medium active:scale-95 transition-transform`}>
    <span>{icon}</span> {label}
  </button>
);

const NavTab = ({ icon, label, active }: { icon: string; label: string; active?: boolean }) => (
  <div className={`flex flex-col items-center text-xs ${active ? "text-[#FFB703]" : "text-gray-400"}`}>
    <span className="text-xl">{icon}</span>
    <span className="mt-0.5">{label}</span>
  </div>
);

export default Dashboard;
