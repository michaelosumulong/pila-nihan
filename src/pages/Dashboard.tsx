import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { generateDailyBypassCode } from "@/lib/bypass-code";
import NotificationCenter from "@/components/NotificationCenter";
import { useLowBattery } from "@/hooks/use-low-battery";
import LowBatteryBanner from "@/components/LowBatteryBanner";
import LowBatteryToggle from "@/components/LowBatteryToggle";
import BusinessProfileCard from "@/components/BusinessProfileCard";
import PendingAudits from "@/components/PendingAudits";
import FiveWhysModal from "@/components/FiveWhysModal";
import VersionFooter from "@/components/VersionFooter";
import PilaLogo from "@/components/PilaLogo";
import FoundingMerchantBadge from "@/components/FoundingMerchantBadge";
import { AntiCorruptionBadge, SuriValueBadge } from "@/components/TrustBadges";

interface MerchantData {
  id: string;
  businessName: string;
  ownerName: string;
  mobile: string;
  category: string;
  address: string;
  email: string;
  plan: string;
  shopCode?: string;
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
  const { lowBatteryMode, lastRefresh, toggleLowBattery, manualRefresh } = useLowBattery();
  const [shopCode, setShopCode] = useState("");
  const [isEditingCode, setIsEditingCode] = useState(false);
  const [editableCode, setEditableCode] = useState("");
  const [showFiveWhys, setShowFiveWhys] = useState(false);
  const [fiveWhysIssue, setFiveWhysIssue] = useState("");
  const [backlogItems, setBacklogItems] = useState<any[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem("pila-merchant");
    if (!raw) {
      navigate("/");
      return;
    }
    try {
      const parsed = JSON.parse(raw);

      // Ensure shop code exists
      if (!parsed.shopCode) {
        const businessName = parsed.businessName || "DEMO";
        const generated = businessName
          .toUpperCase()
          .replace(/[^A-Z]/g, "")
          .substring(0, 6)
          .padEnd(6, "X");
        parsed.shopCode = generated || "PILANI";
        localStorage.setItem("pila-merchant", JSON.stringify(parsed));
      }

      setMerchant(parsed);
      setShopCode(parsed.shopCode);
      setEditableCode(parsed.shopCode);

      // Generate Suri Backlog
      const tickets = JSON.parse(localStorage.getItem("tickets") || "[]");
      const targetTime = parsed.targetHandlingTime || 8;
      const today = new Date().toISOString().split("T")[0];
      const backlog: any[] = [];

      tickets
        .filter((t: any) => t.status === "served" && t.served_at?.startsWith(today))
        .forEach((ticket: any) => {
          if (ticket.served_at && ticket.called_at) {
            const handlingTime = (new Date(ticket.served_at).getTime() - new Date(ticket.called_at).getTime()) / 1000 / 60;
            if (handlingTime > targetTime * 1.5) {
              backlog.push({
                id: `backlog-${ticket.id}`,
                type: "excessive_handling",
                ticket: ticket.ticketNumber,
                customer: ticket.customerName,
                actual: Math.round(handlingTime),
                target: targetTime,
                variance: Math.round(handlingTime - targetTime),
                timestamp: ticket.served_at,
              });
            }
          }
        });

      const served = tickets
        .filter((t: any) => t.status === "served" && t.served_at?.startsWith(today))
        .sort((a: any, b: any) => new Date(a.served_at).getTime() - new Date(b.served_at).getTime());

      for (let i = 1; i < served.length; i++) {
        const gap = (new Date(served[i].called_at).getTime() - new Date(served[i - 1].served_at).getTime()) / 1000 / 60;
        if (gap >= 15) {
          backlog.push({
            id: `backlog-gap-${i}`,
            type: "idle_time",
            gap: Math.round(gap),
            before: served[i - 1].ticketNumber,
            after: served[i].ticketNumber,
            timestamp: served[i].called_at,
          });
        }
      }
      setBacklogItems(backlog);
    } catch {
      navigate("/");
    }
  }, [navigate]);

  if (!merchant) return null;

  const cat = CATEGORY_MAP[merchant.category] || { label: merchant.category, bg: "bg-gray-100", text: "text-gray-800" };
  const isSuriVerified = ["PANDAY"].includes(merchant.plan);
  const buntingCount = 24;

  const qrUrl = `${window.location.origin}/join/${shopCode.toLowerCase()}`;

  const generateShopCode = () => {
    const businessName = merchant.businessName || "SHOP";
    const generated = businessName
      .toUpperCase()
      .replace(/[^A-Z]/g, "")
      .substring(0, 6)
      .padEnd(6, "X");
    setEditableCode(generated);
    toast.info(`Suggested code: ${generated}`, {
      description: "You can edit it before saving",
    });
  };

  const saveShopCode = () => {
    const cleaned = editableCode.toUpperCase().replace(/[^A-Z0-9]/g, "").substring(0, 10);
    if (cleaned.length < 3) {
      toast.error("Shop code must be at least 3 characters");
      return;
    }
    const updated = { ...merchant, shopCode: cleaned };
    localStorage.setItem("pila-merchant", JSON.stringify(updated));
    setShopCode(cleaned);
    setMerchant(updated);
    setIsEditingCode(false);
    toast.success("Shop Code updated!", {
      description: `Your new link: ${window.location.origin}/join/${cleaned.toLowerCase()}`,
      duration: 8000,
    });
  };

  const downloadQR = () => {
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(qrUrl)}`;
    const link = document.createElement("a");
    link.href = qrApiUrl;
    link.download = `pila-nihan-${shopCode}.png`;
    link.click();
    toast.success("QR Code downloading!", {
      description: "Print and display at your entrance",
    });
  };

  const handleToggleBattery = () => {
    const newMode = toggleLowBattery();
    if (newMode) {
      toast.success("Battery optimization active", {
        description: "Auto-refresh paused. Use Refresh Now to update manually.",
      });
    } else {
      toast.info("Standard mode restored");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-24">
      {/* Header */}
      <div className={lowBatteryMode ? "bg-[#1E3A8A]" : "bg-gradient-to-r from-[#1E3A8A] to-[#2563EB]"}>
        {!lowBatteryMode && (
        <div className="bunting pt-2 pb-1">
          {Array.from({ length: buntingCount }).map((_, i) => (
            <div key={i} className="bunting-triangle" />
          ))}
        </div>
        )}
        <div className="flex items-center justify-between px-5 pt-3 pb-6">
          <button onClick={() => setMenuOpen(!menuOpen)} className="text-white text-2xl">☰</button>
          <div className="flex flex-col items-center">
            <PilaLogo className="w-16 h-16 mb-1" />
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-primary">Dashboard</h1>
              {lowBatteryMode && (
                <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-bold">
                  🔋 Saver
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/settings")}
              className="text-white hover:text-[#FFB703] transition-colors p-2"
              title="Settings"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <NotificationCenter variant="dark" />
          </div>
        </div>

        {/* Welcome */}
        <div className="px-6 pb-8">
          <p className="text-white text-xl">
            Maligayang araw, <span className="font-bold">{merchant.businessName}</span>!
          </p>
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

      {/* Main Content */}
      <div className="px-6 -mt-4">
        {lowBatteryMode && (
          <LowBatteryBanner lastRefresh={lastRefresh} onRefresh={() => { manualRefresh(); toast.success("Dashboard refreshed!"); }} />
        )}
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <StatCard icon="👥" value="24" label="Sa Pila Ngayon" valueColor="text-[#1E3A8A]" />
          <StatCard icon="✅" value="158" label="Naserve Today" valueColor="text-[#10B981]" />
          <StatCard icon="💰" value={`₱${merchant.wallet.balance.toLocaleString()}`} label="Wallet Balance" valueColor="text-[#FFB703]" smaller />
          <StatCard icon="🎟️" value={`₱${merchant.wallet.credits.toLocaleString()}`} label="Prepaid Credits" valueColor="text-[#3B82F6]" smaller />
        </div>

        {/* Quick Actions */}
        <div className="flex gap-3 overflow-x-auto pb-1 mb-6 scrollbar-hide">
          <ActionButton icon="📢" label="Call Next" bg="bg-[#10B981]" />
          <ActionButton icon="👀" label="View Queue" bg="bg-[#3B82F6]" />
          <ActionButton icon="⚙️" label="Settings" bg="bg-[#6B7280]" />
          <button onClick={() => navigate("/guide?tab=merchant")} className="bg-blue-100 text-blue-700 px-4 py-2 rounded-xl font-bold text-sm hover:bg-blue-200 whitespace-nowrap flex items-center gap-1">
            📖 Quick Guide
          </button>
        </div>

        {/* Revenue Chart */}
        <div className="bg-white rounded-2xl shadow-lg p-5 mb-6 border border-primary/20">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">7-Day Revenue</h3>
          <div className="flex items-end justify-between gap-2 h-32">
            {[
              { day: "Mon", h: 55 },
              { day: "Tue", h: 72 },
              { day: "Wed", h: 75 },
              { day: "Thu", h: 69 },
              { day: "Fri", h: 87 },
              { day: "Sat", h: 100 },
              { day: "Sun", h: 21 },
            ].map((d) => (
              <div key={d.day} className="flex flex-col items-center flex-1 h-full justify-end">
                <div className="w-full max-w-[28px] rounded-t-md bg-[#FFD700]" style={{ height: `${d.h}%` }} />
                <span className="text-[10px] text-gray-500 mt-1">{d.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Suri Quality Alerts */}
        {backlogItems.length > 0 ? (
          <div className="bg-white rounded-2xl shadow-2xl p-6 mb-6 border-l-8 border-red-500">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🔍</span>
                <div>
                  <h3 className="text-2xl font-bold text-red-600">Suri Quality Alerts</h3>
                  <p className="text-sm text-gray-600">Issues detected today requiring analysis</p>
                </div>
              </div>
              <div className="bg-red-500 text-white px-4 py-2 rounded-full font-bold text-xl">
                {backlogItems.length}
              </div>
            </div>
            <div className="space-y-3">
              {backlogItems.slice(0, 3).map((item: any) => (
                <div key={item.id} className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-lg hover:shadow-lg transition-shadow">
                  {item.type === "excessive_handling" ? (
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">⚠️</span>
                          <p className="font-bold text-gray-900 text-lg">Excessive Handling Time</p>
                        </div>
                        <p className="text-sm text-gray-700 mb-1">
                          <strong className="text-red-600">{item.ticket}</strong> ({item.customer}) took{" "}
                          <strong className="text-red-600">{item.actual} minutes</strong>
                        </p>
                        <p className="text-xs text-gray-600">
                          Target: {item.target} min • Actual: {item.actual} min •{" "}
                          <span className="text-red-600 font-bold">+{item.variance} min over</span>
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setFiveWhysIssue(`Ticket ${item.ticket} took ${item.actual} minutes (${item.variance} min over ${item.target} min target)`);
                          setShowFiveWhys(true);
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold whitespace-nowrap shadow-lg transition-all transform hover:scale-105"
                      >
                        🧐 Analyze Now
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">⏸️</span>
                          <p className="font-bold text-gray-900 text-lg">Idle Time Detected</p>
                        </div>
                        <p className="text-sm text-gray-700 mb-1">
                          <strong className="text-yellow-600">{item.gap} minute gap</strong> between {item.before} and {item.after}
                        </p>
                        <p className="text-xs text-gray-600">No customers served during this period - potential Muda (waste)</p>
                      </div>
                      <button
                        onClick={() => {
                          setFiveWhysIssue(`${item.gap} minute idle time between ${item.before} and ${item.after}`);
                          setShowFiveWhys(true);
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold whitespace-nowrap shadow-lg transition-all transform hover:scale-105"
                      >
                        🧐 Analyze Now
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
            {backlogItems.length > 3 && (
              <div className="mt-4 text-center">
                <button
                  onClick={() => navigate("/analytics")}
                  className="text-blue-600 hover:text-blue-700 font-bold"
                >
                  View all {backlogItems.length} issues in Analytics →
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-green-50 border-l-8 border-green-500 rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-3">
              <span className="text-4xl">✅</span>
              <div>
                <h3 className="text-xl font-bold text-green-700">No Quality Issues Today</h3>
                <p className="text-sm text-green-600">All tickets handled within target time • No idle gaps detected</p>
              </div>
            </div>
          </div>
        )}

        {/* ENHANCED MERCHANT DEMO KIT */}
        <div className="bg-gradient-to-br from-[#1E3A8A] to-[#3B82F6] rounded-2xl shadow-2xl p-6 mb-6 text-white">
          <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">🎫 Merchant Demo Kit</h3>

          <div className="grid md:grid-cols-2 gap-6">
            {/* SHOP CODE */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border-2 border-white/30">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm text-white/80 font-semibold">Your Shop Code</div>
                {!isEditingCode ? (
                  <button onClick={() => setIsEditingCode(true)} className="text-white/80 hover:text-white text-sm flex items-center gap-1">
                    ✏️ Edit
                  </button>
                ) : (
                  <button
                    onClick={() => { setIsEditingCode(false); setEditableCode(shopCode); }}
                    className="text-white/80 hover:text-white text-sm"
                  >
                    ✕ Cancel
                  </button>
                )}
              </div>

              {!isEditingCode ? (
                <>
                  <div className="bg-white/20 rounded-lg p-4 mb-3">
                    <div className="text-5xl sm:text-6xl font-bold font-mono tracking-widest text-center text-white drop-shadow-lg">
                      {shopCode}
                    </div>
                  </div>
                  <div className="text-xs text-white/70 mb-4 text-center">
                    Customers enter this at: {window.location.origin}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(qrUrl);
                        toast.success("Link copied to clipboard!");
                      }}
                      className="bg-white/20 hover:bg-white/30 px-3 py-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-1"
                    >
                      📋 Copy Link
                    </button>
                    <button
                      onClick={downloadQR}
                      className="bg-[#FFD700]/80 hover:bg-[#FFD700] text-[#1E3A8A] px-3 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-1"
                    >
                      📥 QR Code
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <input
                    type="text"
                    value={editableCode}
                    onChange={(e) => setEditableCode(e.target.value.toUpperCase())}
                    placeholder="MYSHOP"
                    maxLength={10}
                    className="w-full px-4 py-3 rounded-lg border-2 border-white/30 bg-white/20 text-white text-2xl font-mono font-bold text-center uppercase tracking-widest placeholder-white/40 focus:outline-none focus:border-[#FFD700]"
                  />
                  <div className="text-xs text-white/70 mt-2 mb-3 text-center">
                    3-10 characters • Letters and numbers only
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={generateShopCode} className="bg-white/20 hover:bg-white/30 px-3 py-2 rounded-lg text-xs font-semibold transition-all">
                      ✨ Auto-Generate
                    </button>
                    <button onClick={saveShopCode} className="bg-[#10B981] hover:bg-[#059669] px-3 py-2 rounded-lg text-xs font-bold transition-all">
                      💾 Save Code
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* DAILY BYPASS CODE - PROMINENT & COPY-FRIENDLY */}
            <div className="bg-[#FFD700]/20 backdrop-blur-sm rounded-xl p-6 border-2 border-[#FFD700]">
              <div className="text-sm text-white/80 mb-2 flex items-center gap-2 font-semibold">
                🔑 Today's Bypass Code
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded">Changes daily</span>
              </div>
              <div
                onClick={() => {
                  navigator.clipboard.writeText(generateDailyBypassCode(merchant.id || "pila-nihan"));
                  toast.success("Bypass code copied!");
                }}
                className="text-5xl font-bold font-mono tracking-widest mb-3 text-[#FFD700] text-center cursor-pointer hover:scale-105 transition-transform"
                title="Click to copy"
              >
                {generateDailyBypassCode(merchant.id || "pila-nihan")}
              </div>
              <p className="text-xs text-white/90 mb-3 text-center">
                Tap code to copy • Valid for today only
              </p>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(generateDailyBypassCode(merchant.id || "pila-nihan"));
                  toast.success("Bypass code copied!");
                }}
                className="w-full bg-white/20 hover:bg-white/30 px-3 py-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-1 mb-3"
              >
                📋 Copy Code
              </button>
              <div className="bg-yellow-500/20 border-l-4 border-yellow-400 p-3 rounded">
                <p className="text-xs text-white">
                  💡 <strong>When to use:</strong> Give this code to customers who can't join
                  due to weak GPS signal or location errors. They enter it in the "Having GPS trouble?"
                  field on their phone.
                </p>
              </div>
            </div>
          </div>

          {/* QR CODE INSTRUCTIONS */}
          <div className="mt-6 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-24 h-24 bg-white rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-3xl mb-1">📱</div>
                    <div className="text-xs text-gray-600">QR Code</div>
                  </div>
                </div>
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-white mb-2">How Customers Join:</h4>
                <div className="grid grid-cols-2 gap-3 text-xs text-white/90">
                  <div className="bg-white/5 rounded-lg p-2">
                    <div className="font-bold mb-1">Option 1: QR Code</div>
                    <div className="text-white/70">
                      1. Click "📥 QR Code" above<br />
                      2. Print and display<br />
                      3. Customers scan to join
                    </div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-2">
                    <div className="font-bold mb-1">Option 2: Shop Code</div>
                    <div className="text-white/70">
                      1. Customer goes to site<br />
                      2. Enters: <strong>{shopCode}</strong><br />
                      3. Joins queue instantly
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trust Signals */}
        <div className="space-y-4 mb-6">
          <FoundingMerchantBadge />
          <SuriValueBadge plan={merchant.plan} />
          <AntiCorruptionBadge />
        </div>

        {/* Business Profile */}
        <BusinessProfileCard />

        {/* Announcement */}
        <div className="bg-[#FFF9E6] border-l-4 border-[#FFB703] p-4 rounded-lg mb-6 flex justify-between items-start">
          <div>
            <p className="text-sm font-semibold text-gray-800">🔔 Announcement</p>
            <p className="text-sm text-gray-600 mt-1">Welcome to Pila-nihan! Your queue is ready.</p>
          </div>
          <button className="text-[#3B82F6] text-sm font-medium shrink-0">Edit</button>
        </div>

        <VersionFooter />
      </div>

      <FiveWhysModal open={showFiveWhys} onClose={() => { setShowFiveWhys(false); setFiveWhysIssue(""); }} initialIssue={fiveWhysIssue} />

      {/* Slide-out Menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMenuOpen(false)} />
          <div className="relative w-64 bg-white h-full shadow-xl p-6 z-10 animate-in slide-in-from-left">
            <p className="text-gray-900 font-bold text-lg">{merchant.ownerName}</p>
            <p className="text-gray-600 text-sm mb-6">{merchant.mobile}</p>
            <nav className="space-y-1 text-sm">
              <p className="flex items-center gap-3 px-4 py-3 bg-[#1E3A8A] text-white rounded-lg">🏠 Dashboard</p>
              <p className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 hover:text-[#1E3A8A] transition-colors cursor-pointer rounded-lg" onClick={() => { setMenuOpen(false); navigate("/queue"); }}>📋 Queue</p>
              <p className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 hover:text-[#1E3A8A] transition-colors cursor-pointer rounded-lg" onClick={() => { setMenuOpen(false); navigate("/analytics"); }}>📊 Analytics</p>
              <p className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 hover:text-[#1E3A8A] transition-colors cursor-pointer rounded-lg" onClick={() => toast.info("Wallet feature coming soon!")}>💰 Wallet</p>
              <p className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 hover:text-[#1E3A8A] transition-colors cursor-pointer rounded-lg" onClick={() => toast.info("Settings feature coming soon!")}>⚙️ Settings</p>
              <LowBatteryToggle active={lowBatteryMode} onToggle={handleToggleBattery} />
              <div className="border-t border-gray-200 mt-2 pt-2">
                <p className="flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 transition-colors cursor-pointer rounded-lg" onClick={() => { localStorage.removeItem("pila-merchant"); navigate("/"); }}>
                  🚪 Logout
                </p>
              </div>
            </nav>
          </div>
        </div>
      )}

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around py-3 z-40">
        <NavTab icon="🏠" label="Dashboard" active />
        <NavTab icon="📋" label="Queue" onClick={() => navigate("/queue")} />
        <NavTab icon="💰" label="Wallet" onClick={() => toast.info("Wallet feature coming soon!")} />
        <NavTab icon="⚙️" label="Settings" onClick={() => toast.info("Settings feature coming soon!")} />
      </div>
    </div>
  );
};

const StatCard = ({ icon, value, label, valueColor, smaller }: {
  icon: string; value: string; label: string; valueColor: string; smaller?: boolean;
}) => (
  <div className="bg-white rounded-2xl shadow-lg p-5 border border-primary/20">
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

const NavTab = ({ icon, label, active, onClick }: { icon: string; label: string; active?: boolean; onClick?: () => void }) => (
  <div
    className={`flex flex-col items-center text-xs cursor-pointer hover:text-gray-600 transition-colors ${active ? "text-[#FFB703]" : "text-gray-400"}`}
    onClick={onClick}
  >
    <span className="text-xl">{icon}</span>
    <span className="mt-0.5">{label}</span>
  </div>
);

export default Dashboard;
