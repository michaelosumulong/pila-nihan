import { useState, useEffect } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { useBranding } from "@/contexts/BrandingContext";
import PilaLogo from "@/components/PilaLogo";
import {
  LayoutDashboard,
  ListOrdered,
  DollarSign,
  BarChart3,
  Settings,
  CreditCard,
  LogOut,
  User,
  Zap,
  Battery,
  BatteryLow,
  Lock,
  Menu,
  X,
} from "lucide-react";

interface NavItem {
  label: string;
  icon: any;
  path: string;
  premium?: boolean;
  requiredPlan?: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Queue Controls", icon: ListOrdered, path: "/queue" },
  { label: "Revenue", icon: DollarSign, path: "/revenue" },
  { label: "Analytics", icon: BarChart3, path: "/analytics", premium: true, requiredPlan: "sinag" },
  { label: "Settings", icon: Settings, path: "/settings" },
];

const PLAN_LEVEL: Record<string, number> = { panday: 0, sinag: 1, suri: 2 };

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { branding, customLogo, businessName } = useBranding();
  const [menuOpen, setMenuOpen] = useState(false);
  const [merchant, setMerchant] = useState<any>(null);
  const [lowBatteryMode, setLowBatteryMode] = useState(
    localStorage.getItem("pila-low-battery") === "true"
  );

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
  }, [navigate, location.pathname]);

  const currentPlanLevel = PLAN_LEVEL[merchant?.servicePlan || "panday"] || 0;

  const isLocked = (item: NavItem) =>
    item.premium && item.requiredPlan
      ? currentPlanLevel < (PLAN_LEVEL[item.requiredPlan] || 0)
      : false;

  const handleNav = (item: NavItem) => {
    if (isLocked(item)) {
      navigate("/billing");
    } else {
      navigate(item.path);
    }
    setMenuOpen(false);
  };

  const toggleLowBattery = () => {
    const next = !lowBatteryMode;
    setLowBatteryMode(next);
    localStorage.setItem("pila-low-battery", String(next));
  };

  if (!merchant) return null;

  const buntingCount = 30;

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#0A2569]">
      {/* Logo Header */}
      <div className="p-5 border-b border-white/10">
        <div className="flex items-center gap-3 mb-3">
          {customLogo ? (
            <img src={customLogo} alt="Logo" className="h-12 w-12 object-contain rounded-lg" />
          ) : (
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-2xl">{branding?.emoji || "🇵🇭"}</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="text-white font-bold text-sm leading-tight truncate">
              {businessName || "Pila-nihan"}
            </h2>
            <p className="text-white/60 text-xs font-mono">
              {merchant?.shopCode || "DEMO"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-primary text-primary-foreground rounded-full text-xs font-black uppercase">
            {merchant?.servicePlan || "PANDAY"}
          </span>
          {merchant?.foundingMerchantNumber && merchant.foundingMerchantNumber <= 50 && (
            <span className="px-2 py-1 bg-purple-600 text-white rounded-full text-xs font-bold">
              #{merchant.foundingMerchantNumber}
            </span>
          )}
        </div>

        {/* Prepaid Credits Widget */}
        <div className="px-4 pt-4 border-b border-white/10 pb-4">
          <div className="bg-white/5 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/60 text-xs font-semibold">Prepaid Credits</span>
              <CreditCard size={14} className="text-[#FFB703]" />
            </div>
            <p className="text-2xl font-black text-[#FFB703] mb-3">
              ₱{(merchant?.prepaidCredits || 0).toLocaleString()}
            </p>
            <button
              onClick={() => navigate('/billing?action=topup')}
              className="w-full py-2 bg-[#FFB703] text-[#0A2569] rounded-lg font-bold text-sm hover:bg-[#FF8C00] transition-colors"
            >
              + Top Up
            </button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 text-sm">
        {NAV_ITEMS.map((item) => {
          const active = location.pathname === item.path;
          const locked = isLocked(item);
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              onClick={() => handleNav(item)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                active
                  ? "bg-primary text-primary-foreground font-bold shadow-lg"
                  : locked
                  ? "text-white/40 hover:text-white/60"
                  : "text-white/80 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon size={18} />
              {item.label}
              {item.premium && <Zap size={12} className="ml-auto text-yellow-400" />}
              {locked && <Lock size={12} className="ml-1 text-white/40" />}
            </button>
          );
        })}

        {/* Subscription Link */}
        <button
          onClick={() => { navigate("/billing"); setMenuOpen(false); }}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors mt-4 border-2 ${
            location.pathname === "/billing"
              ? "bg-purple-600 text-white border-purple-400 font-bold shadow-lg"
              : "border-purple-400/50 text-purple-300 hover:bg-purple-900/30"
          }`}
        >
          <CreditCard size={18} />
          Subscription
        </button>
      </nav>

      {/* User Profile + Controls */}
      <div className="p-4 border-t border-white/10">
        {/* Profile */}
        <div className="bg-white/5 rounded-lg p-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
              <User size={20} className="text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm truncate">
                {merchant.ownerName || merchant.businessName || "Merchant"}
              </p>
              <p className="text-white/60 text-xs truncate">
                {merchant.mobile || merchant.contactNumber || merchant.email || "No contact"}
              </p>
            </div>
          </div>
        </div>

        {/* Low Battery Toggle */}
        <div className="bg-white/5 rounded-lg p-3 mb-3">
          <button onClick={toggleLowBattery} className="w-full flex items-center justify-between">
            <div className="flex items-center gap-2">
              {lowBatteryMode ? (
                <BatteryLow size={16} className="text-green-400" />
              ) : (
                <Battery size={16} className="text-white/60" />
              )}
              <div>
                <span className="text-white text-xs font-semibold">Low Battery Mode</span>
                <p className="text-white/40 text-[10px]">
                  {lowBatteryMode ? "Active (60s refresh)" : "Inactive (5s refresh)"}
                </p>
              </div>
            </div>
            <div className={`w-10 h-6 rounded-full transition-colors ${lowBatteryMode ? "bg-green-500" : "bg-gray-600"}`}>
              <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform mt-1 ${lowBatteryMode ? "translate-x-5" : "translate-x-1"}`} />
            </div>
          </button>
        </div>

        {/* Logout */}
        <button
          onClick={() => {
            if (window.confirm("Are you sure you want to logout?")) {
              localStorage.removeItem("pila-merchant");
              navigate("/");
            }
          }}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10 transition-all border border-red-400/20"
        >
          <LogOut size={18} />
          <span className="font-semibold text-sm">Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-shrink-0 md:fixed md:inset-y-0 z-30">
        {sidebarContent}
      </aside>

      {/* Main Area */}
      <div className="flex-1 md:ml-64 min-h-screen bg-muted/30">
        {/* Mobile Header */}
        <div
          className="md:hidden brand-transition"
          style={{
            background: lowBatteryMode
              ? branding.primary
              : `linear-gradient(to right, ${branding.primary}, ${branding.primary}dd)`,
          }}
        >
          {!lowBatteryMode && (
            <div className="bunting pt-2 pb-1">
              {Array.from({ length: buntingCount }).map((_, i) => (
                <div key={i} className="bunting-triangle" />
              ))}
            </div>
          )}
          <div className="flex items-center justify-between px-4 py-3">
            <button onClick={() => setMenuOpen(true)} className="text-white p-2 hover:bg-white/10 rounded-lg">
              <Menu size={24} />
            </button>
            <div className="flex items-center gap-2">
              {customLogo ? (
                <img src={customLogo} alt="Logo" className="w-8 h-8 object-contain" />
              ) : (
                <PilaLogo className="w-8 h-8" />
              )}
              <span className="text-white font-bold text-sm">{businessName}</span>
            </div>
            <span className="px-2 py-1 bg-primary text-primary-foreground rounded-full text-xs font-black uppercase">
              {merchant?.servicePlan || "PANDAY"}
            </span>
          </div>
        </div>

        {/* Mobile Sidebar Overlay */}
        {menuOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            <div className="absolute inset-0 bg-black/40" onClick={() => setMenuOpen(false)} />
            <div className="relative w-64 h-full z-10 animate-in slide-in-from-left">
              <button
                onClick={() => setMenuOpen(false)}
                className="absolute top-4 right-4 text-white/60 hover:text-white z-20"
              >
                <X size={20} />
              </button>
              {sidebarContent}
            </div>
          </div>
        )}

        {/* Page Content */}
        <Outlet />
      </div>
    </div>
  );
}
