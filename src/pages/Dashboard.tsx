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
// PilaLogo now in DashboardLayout
import FoundingMerchantBadge from "@/components/FoundingMerchantBadge";
import { AntiCorruptionBadge, SuriValueBadge } from "@/components/TrustBadges";
import { useBranding } from "@/contexts/BrandingContext";
import { getNoShowMetrics } from "@/utils/noShowEngine";
import { generateDMAICRecommendations } from "@/utils/suriEngine";
import { AlertCircle, TrendingDown, Crown } from "lucide-react";
// Lucide icons now in DashboardLayout
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
  Express: { label: "⚡ Express", bg: "bg-green-100", text: "text-green-800" },
  Standard: { label: "🏃 Standard", bg: "bg-blue-100", text: "text-blue-800" },
  Technical: { label: "⏳ Technical", bg: "bg-orange-100", text: "text-orange-800" },
  // Legacy fallbacks
  LINGKOD: { label: "Government", bg: "bg-purple-100", text: "text-purple-800" },
  SULONG: { label: "🏃 Standard", bg: "bg-green-100", text: "text-green-800" },
  AGOS: { label: "⚡ Express", bg: "bg-blue-100", text: "text-blue-800" },
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [merchant, setMerchant] = useState<MerchantData | null>(null);
  
  const { lowBatteryMode, lastRefresh, toggleLowBattery, manualRefresh } = useLowBattery();
  const { branding, customLogo } = useBranding();
  const [shopCode, setShopCode] = useState("");
  const [isEditingCode, setIsEditingCode] = useState(false);
  const [editableCode, setEditableCode] = useState("");
  const [showFiveWhys, setShowFiveWhys] = useState(false);
  const [fiveWhysIssue, setFiveWhysIssue] = useState("");
  const [backlogItems, setBacklogItems] = useState<any[]>([]);
  const [noShowMetrics, setNoShowMetrics] = useState(getNoShowMetrics());

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

  // Initialize SURI AI recommendations
  useEffect(() => {
    const lastGenerated = localStorage.getItem('pila-suri-last-generated');
    const today = new Date().toDateString();

    if (!localStorage.getItem('pila-suri-recommendations') || lastGenerated !== today) {
      const recs = generateDMAICRecommendations();
      localStorage.setItem('pila-suri-recommendations', JSON.stringify(recs));
      localStorage.setItem('pila-suri-last-generated', today);
      console.log(`🧠 SURI AI: Generated ${recs.length} DMAIC recommendations`);
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setNoShowMetrics(getNoShowMetrics()), 30000);
    return () => clearInterval(interval);
  }, []);

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
    <div className="min-h-screen bg-muted/30 pb-6">

      {/* Main Content */}
      <div className="px-6">
        {/* PAGE HEADER */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-1">
            Welcome back, {merchant?.businessName || 'Merchant'}! 👋
          </h1>
          <p className="text-muted-foreground text-lg">
            Here's your queue performance at a glance
          </p>
        </div>
        {lowBatteryMode && (
          <LowBatteryBanner lastRefresh={lastRefresh} onRefresh={() => { manualRefresh(); toast.success("Dashboard refreshed!"); }} />
        )}
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <StatCard icon="👥" value="24" label="Sa Pila Ngayon" valueColor="text-[#1E3A8A]" />
          <StatCard icon="✅" value="158" label="Naserve Today" valueColor="text-[#10B981]" />
          <StatCard icon="💰" value={`₱${(merchant.wallet?.balance ?? 0).toLocaleString()}`} label="Wallet Balance" valueColor="text-[#FFB703]" smaller />
          <StatCard icon="🎟️" value={`₱${(merchant.wallet?.credits ?? 0).toLocaleString()}`} label="Prepaid Credits" valueColor="text-[#3B82F6]" smaller />
        </div>

        {/* Quick Actions */}
        <div className="flex gap-3 overflow-x-auto pb-1 mb-6 scrollbar-hide">
          <ActionButton icon="📢" label="Call Next" bg="bg-[#10B981]" onClick={() => navigate("/queue")} />
          <ActionButton icon="👀" label="View Queue" bg="bg-[#3B82F6]" onClick={() => navigate("/queue")} />
          <ActionButton icon="⚙️" label="Settings" bg="bg-[#6B7280]" onClick={() => navigate("/settings")} />
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

        {/* REVENUE LEAKAGE ALERT */}
        {noShowMetrics.count > 0 && (
          <div className="bg-white rounded-2xl shadow-2xl p-6 mb-6 border-l-8 border-red-500">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <TrendingDown className="text-red-600" size={24} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <AlertCircle size={18} className="text-red-500" />
                  <h3 className="text-lg font-bold text-red-600">💸 Revenue Leakage Alert</h3>
                </div>
                <p className="text-3xl font-black text-red-600 mb-1">
                  ₱{noShowMetrics.totalLost.toLocaleString()}
                </p>
                <p className="text-sm text-gray-600 mb-3">
                  Lost today due to {noShowMetrics.count} no-shows ({noShowMetrics.rate}% no-show rate)
                </p>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="bg-red-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">📊 Projected Monthly</p>
                    <p className="text-lg font-bold text-red-600">₱{noShowMetrics.projectedMonthly.toLocaleString()}</p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">📈 Projected Yearly</p>
                    <p className="text-lg font-bold text-red-600">₱{noShowMetrics.projectedYearly.toLocaleString()}</p>
                  </div>
                </div>

                {noShowMetrics.forcedPercentage > 30 && (
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded mb-3">
                    <p className="text-sm text-yellow-800">
                      ⚠️ {noShowMetrics.forcedPercentage}% of no-shows were marked before the 30-min deadline. This may hurt customer satisfaction.
                    </p>
                  </div>
                )}

                {merchant?.plan !== 'SURI' && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <p className="text-sm text-purple-700 mb-3">
                      SURI AI can analyze no-show patterns and help you recover up to{' '}
                      <strong>₱{Math.round(noShowMetrics.projectedMonthly * 0.6).toLocaleString()}/month</strong>
                    </p>
                    <button
                      onClick={() => navigate('/billing')}
                      className="w-full bg-purple-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-purple-700 flex items-center justify-center gap-2 shadow-lg transition-all hover:scale-105"
                    >
                      <Crown size={18} />
                      Upgrade to SURI AI (₱3,499/mo)
                    </button>
                    <p className="text-xs text-purple-500 mt-2 text-center">
                      Save ₱{Math.round(noShowMetrics.projectedMonthly * 0.6 - 3499).toLocaleString()}/month = {Math.round((noShowMetrics.projectedMonthly * 0.6 / 3499) * 10) / 10}x ROI
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

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

const ActionButton = ({ icon, label, bg, onClick }: { icon: string; label: string; bg: string; onClick?: () => void }) => (
  <button onClick={onClick} className={`${bg} text-white rounded-xl px-6 py-3 flex items-center gap-2 whitespace-nowrap font-medium active:scale-95 transition-transform`}>
    <span>{icon}</span> {label}
  </button>
);


export default Dashboard;
