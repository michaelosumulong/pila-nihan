import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { useLowBattery } from "@/hooks/use-low-battery";
import LowBatteryBanner from "@/components/LowBatteryBanner";
import LowBatteryToggle from "@/components/LowBatteryToggle";
import FiveWhysModal from "@/components/FiveWhysModal";
const hourlyData = [
  { hour: "8 AM", customers: 12 },
  { hour: "9 AM", customers: 28 },
  { hour: "10 AM", customers: 45 },
  { hour: "11 AM", customers: 38 },
  { hour: "12 PM", customers: 32 },
  { hour: "1 PM", customers: 25 },
  { hour: "2 PM", customers: 42 },
  { hour: "3 PM", customers: 35 },
  { hour: "4 PM", customers: 28 },
  { hour: "5 PM", customers: 18 },
];

const trendData = [
  { day: "Mon", waitTime: 18 },
  { day: "Tue", waitTime: 16 },
  { day: "Wed", waitTime: 14 },
  { day: "Thu", waitTime: 13 },
  { day: "Fri", waitTime: 12 },
  { day: "Sat", waitTime: 11 },
  { day: "Sun", waitTime: 10 },
];

const Analytics = () => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [noShowStats, setNoShowStats] = useState({ count: 0, rate: 0, totalServed: 158 });
  const [showFiveWhys, setShowFiveWhys] = useState(false);
  const { lowBatteryMode, lastRefresh, toggleLowBattery, manualRefresh } = useLowBattery();
  const buntingCount = 24;

  const handleToggleBattery = () => {
    const newMode = toggleLowBattery();
    if (newMode) {
      toast.success("Battery optimization active");
    } else {
      toast.info("Standard mode restored");
    }
  };

  useEffect(() => {
    const raw = localStorage.getItem("pila-merchant");
    if (!raw) {
      navigate("/");
      return;
    }

    // Load analytics from localStorage
    const today = new Date().toISOString().split("T")[0];
    const analyticsData = JSON.parse(localStorage.getItem("pila-analytics") || "{}");
    const todayData = analyticsData[today];

    if (todayData) {
      const total = todayData.completed + todayData.no_shows;
      setNoShowStats({
        count: todayData.no_shows,
        rate: total > 0 ? parseFloat(((todayData.no_shows / total) * 100).toFixed(1)) : 0,
        totalServed: 158 + todayData.completed,
      });
    }

    setTimeout(() => setLoaded(true), 100);
  }, [navigate]);

  const noShowBadge = noShowStats.rate < 5
    ? { label: "EXCELLENT", cls: "bg-green-100 text-green-800" }
    : noShowStats.rate < 10
    ? { label: "STABLE", cls: "bg-yellow-100 text-yellow-800" }
    : { label: "NEEDS ATTENTION", cls: "bg-red-100 text-red-800" };

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
            <div className="w-16 h-16 bg-[#3B82F6] rounded-xl flex items-center justify-center logo-glow mb-1">
              <span className="text-3xl">📊</span>
            </div>
            <h1 className="text-xl font-bold text-white">Suri Analytics</h1>
            <p className="text-[#FFD700] italic text-sm">Six Sigma Business Intelligence</p>
          </div>
          <span className="bg-[#FFD700] text-[#1E3A8A] px-3 py-1 rounded-full text-xs font-bold">SURI TIER</span>
        </div>
      </div>

      <div className="px-4 -mt-4">
        {lowBatteryMode && (
          <LowBatteryBanner lastRefresh={lastRefresh} onRefresh={() => { manualRefresh(); toast.success("Analytics refreshed!"); }} />
        )}
        {/* Action buttons */}
        <div className="flex justify-end gap-2 mb-4">
          <button
            onClick={() => setShowFiveWhys(true)}
            className="bg-white text-gray-700 text-sm font-medium px-4 py-2 rounded-lg shadow hover:shadow-md flex items-center gap-2"
          >
            🧐 5 Whys Analysis
          </button>
          <button
            onClick={() => toast.info("PDF report generation coming soon!")}
            className="bg-white text-gray-700 text-sm font-medium px-4 py-2 rounded-lg shadow hover:shadow-md flex items-center gap-2"
          >
            📥 Download PDF Report
          </button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <MetricCard
            icon="👥" value={String(noShowStats.totalServed)} label="Clients Served Today"
            valueColor="text-[#1E3A8A]"
            extra={<p className="text-xs text-green-600 font-semibold mt-1">↗️ +12% vs yesterday</p>}
            delay={0} loaded={loaded}
          />
          <MetricCard
            icon="⏱️" value="8.5 min" label="Avg Handling Time"
            valueColor="text-[#10B981]"
            extra={
              <div className="mt-1 space-y-1">
                <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs font-bold">OPTIMIZED</span>
                <p className="text-xs text-gray-500">Target: &lt;10 min ✓</p>
              </div>
            }
            delay={1} loaded={loaded}
          />
          <MetricCard
            icon="⚠️" value={`${noShowStats.rate}%`} label="No-Show Rate"
            valueColor="text-[#FFB703]"
            extra={
              <div className="mt-1 space-y-1">
                <span className={`${noShowBadge.cls} px-2 py-0.5 rounded text-xs font-bold`}>{noShowBadge.label}</span>
                <p className="text-xs text-gray-500">Industry avg: 8% • Total: {noShowStats.count}</p>
              </div>
            }
            delay={2} loaded={loaded}
          />
          <MetricCard
            icon="💰" value="₱4,200" label="Express Revenue Today"
            valueColor="text-[#3B82F6]"
            extra={
              <div className="mt-1 space-y-1">
                <p className="text-xs text-gray-500">Merchant: ₱1,680 | Platform: ₱2,520</p>
                <p className="text-xs text-blue-600 font-semibold">↗️ +8% vs last week</p>
              </div>
            }
            delay={3} loaded={loaded}
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6">
          <div
            className={`bg-white rounded-2xl shadow-lg p-6 lg:col-span-3 transition-all duration-500 hover:shadow-xl ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
            style={{ transitionDelay: "400ms" }}
          >
            <h3 className="text-xl font-bold text-[#1E3A8A] mb-1">Peak Hours Analysis</h3>
            <p className="text-sm text-gray-600 mb-6">Customer arrivals by hour</p>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="customers" fill="#FFD700" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <p className="text-sm font-semibold text-[#FFB703] mt-3">🔥 Peak: 10 AM (45) &amp; 2 PM (42)</p>
          </div>

          <div
            className={`bg-white rounded-2xl shadow-lg p-6 lg:col-span-2 transition-all duration-500 hover:shadow-xl ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
            style={{ transitionDelay: "500ms" }}
          >
            <h3 className="text-xl font-bold text-[#1E3A8A] mb-1">7-Day Wait Time Trend</h3>
            <p className="text-sm text-gray-600 mb-6">Average wait time improving</p>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="waitTime" stroke="#10B981" strokeWidth={3} dot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
            <p className="text-sm font-semibold text-green-600 mt-3">↘️ 44% reduction this week</p>
          </div>
        </div>

        {/* Suri AI Expert Insights */}
        <div
          className={`border-4 border-[#FFD700] bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl shadow-2xl p-6 mb-6 transition-all duration-500 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          style={{ transitionDelay: "600ms" }}
        >
          <div className="mb-4">
            <span className="text-4xl">🤖</span>
            <h3 className="text-2xl font-bold text-[#1E3A8A] mt-2">Suri AI Expert Insights</h3>
            <p className="text-sm text-gray-600 italic">Lean Six Sigma Recommendations</p>
          </div>

          {/* Insight 1 */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">⚠️</span>
              <h4 className="font-bold text-[#EF4444]">Muda (Waste) Identified</h4>
            </div>
            <p className="text-sm text-gray-700 mb-2">Your wait times are 15% higher on Tuesdays between 10-11 AM. Root cause: Single counter handling peak demand.</p>
            <p className="text-sm text-gray-700 mb-1"><strong>Action:</strong> Open Counter 2 during Tuesday 10 AM peak. <strong>Expected Impact:</strong> Reduce wait time by 6 minutes, serve 12 more customers/hour.</p>
            <p className="text-sm text-green-700 font-semibold"><strong>Value:</strong> ₱2,400 additional revenue/week from faster throughput.</p>
          </div>

          <div className="border-t border-gray-300 my-4" />

          {/* Insight 2 */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">📈</span>
              <h4 className="font-bold text-[#3B82F6]">Takt Time Optimization</h4>
            </div>
            <p className="text-sm text-gray-700 mb-2">Your current handling time (8.5 min) is below target. You have capacity for 7 more customers/hour without degrading service quality.</p>
            <p className="text-sm text-gray-700 mb-1"><strong>Action:</strong> Market Express upgrades more aggressively during 2 PM peak when you have excess capacity.</p>
            <p className="text-sm text-green-700 font-semibold"><strong>Value:</strong> ₱1,200 additional Express revenue/day.</p>
          </div>

          <div className="border-t border-gray-300 my-4" />

          {/* Insight 3 */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">✅</span>
              <h4 className="font-bold text-[#10B981]">Performance Benchmark</h4>
            </div>
            <p className="text-sm text-gray-700 mb-2">96% of customers served within 15 minutes (industry average: 78%). Your Sigma Level: <strong>4.2σ</strong> (World-class performance).</p>
            <p className="text-sm text-[#FFB703] font-semibold"><strong>Achievement:</strong> You qualify for 'Suri Certified' badge - display this to attract quality-conscious customers.</p>
          </div>

          {/* Dynamic No-Show Insight */}
          {noShowStats.rate > 5 && (
            <>
              <div className="border-t border-gray-300 my-4" />
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">⚠️</span>
                  <h4 className="font-bold text-[#EF4444]">High No-Show Rate Detected</h4>
                </div>
                <p className="text-sm text-gray-700 mb-2">
                  Your no-show rate is {noShowStats.rate}% (industry average: 8%).
                  This represents {noShowStats.count} customers who didn't show up today.
                </p>
                <p className="text-sm text-gray-700 mb-2">
                  <strong>Root Cause:</strong> Web Push notifications may not be enabled, or notification timing needs optimization.
                </p>
                <p className="text-sm text-gray-700 mb-2">
                  <strong>Action:</strong> Enable Web Push notifications to send alerts when customers are 3rd in line. Send reminder if no movement after 5 minutes.
                </p>
                <p className="text-sm font-semibold text-green-700">
                  <strong>Value:</strong> Reducing no-shows to 4% would recover ₱{Math.round((noShowStats.count - (noShowStats.totalServed * 0.04)) * 150).toLocaleString()} in lost revenue per day.
                </p>
              </div>
            </>
          )}

          {/* Distance-to-No-Show Correlation Insight */}
          {(() => {
            const tickets = JSON.parse(localStorage.getItem("tickets") || "[]");
            const distantTickets = tickets.filter((t: any) => t.distance_from_merchant && t.distance_from_merchant > 3);
            const distantNoShows = distantTickets.filter((t: any) => t.status === "no_show").length;
            const distantNoShowRate = distantTickets.length > 0
              ? parseFloat(((distantNoShows / distantTickets.length) * 100).toFixed(1))
              : 0;
            if (distantTickets.length === 0) return null;
            return (
              <>
                <div className="border-t border-gray-300 my-4" />
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">📍</span>
                    <h4 className="font-bold text-[#3B82F6]">Distance-to-No-Show Correlation</h4>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">
                    Customers joining from &gt;3 km away have a {distantNoShowRate}% no-show rate
                    (vs {noShowStats.rate}% overall). {distantTickets.length} distant ticket(s) tracked.
                  </p>
                  <p className="text-sm text-gray-700 mb-2">
                    <strong>Recommendation:</strong> Consider reducing geofence radius to 3 km
                    during peak hours to minimize ghost customers.
                  </p>
                  <p className="text-sm font-semibold text-green-700">
                    <strong>Value:</strong> Tighter geofencing could reduce no-shows by
                    {" "}{Math.round(Math.max(0, distantNoShowRate - noShowStats.rate) * 0.5)}%, recovering
                    ₱{Math.round(Math.max(0, distantNoShows) * 150 * 0.5).toLocaleString()}/day.
                  </p>
                </div>
              </>
            );
          })()}
        </div>

        {/* Performance Scorecard */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <ScoreCard icon="🎯" metric="96%" label="Within 15-min Target" status="EXCELLENT" statusColor="bg-green-100 text-green-800" loaded={loaded} delay={700} />
          <ScoreCard icon="⚡" metric="18%" label="Express Upgrade Rate" status="ABOVE AVERAGE" statusColor="bg-blue-100 text-blue-800" loaded={loaded} delay={800} />
          <ScoreCard icon="📊" metric="4.2σ" label="Six Sigma Rating" status="WORLD CLASS" statusColor="bg-[#FFF9E6] text-[#B8860B]" loaded={loaded} delay={900} />
        </div>
      </div>

      {/* Slide-out Menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMenuOpen(false)} />
          <div className="relative w-64 bg-white h-full shadow-xl p-6 z-10 animate-in slide-in-from-left">
            <p className="text-gray-900 font-bold text-lg">Menu</p>
            <p className="text-gray-600 text-sm mb-6">Analytics</p>
            <nav className="space-y-1 text-sm">
              <p className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 hover:text-[#1E3A8A] transition-colors cursor-pointer rounded-lg" onClick={() => { setMenuOpen(false); navigate("/dashboard"); }}>🏠 Dashboard</p>
              <p className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 hover:text-[#1E3A8A] transition-colors cursor-pointer rounded-lg" onClick={() => { setMenuOpen(false); navigate("/queue"); }}>📋 Queue</p>
              <p className="flex items-center gap-3 px-4 py-3 bg-[#1E3A8A] text-white rounded-lg">📊 Analytics</p>
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
        <NavTab icon="🏠" label="Dashboard" onClick={() => navigate("/dashboard")} />
        <NavTab icon="📋" label="Queue" onClick={() => navigate("/queue")} />
        <NavTab icon="📊" label="Analytics" active />
        <NavTab icon="⚙️" label="Settings" onClick={() => toast.info("Settings feature coming soon!")} />
      </div>
    </div>
  );
};

const MetricCard = ({ icon, value, label, valueColor, extra, delay, loaded }: {
  icon: string; value: string; label: string; valueColor: string; extra?: React.ReactNode; delay: number; loaded: boolean;
}) => (
  <div
    className={`bg-white rounded-2xl shadow-lg p-6 transition-all duration-500 hover:shadow-xl hover:scale-[1.02] ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
    style={{ transitionDelay: `${delay * 100}ms` }}
  >
    <span className="text-3xl">{icon}</span>
    <p className={`text-3xl lg:text-4xl font-bold ${valueColor} mt-1`}>{value}</p>
    <p className="text-sm text-gray-600">{label}</p>
    {extra}
  </div>
);

const ScoreCard = ({ icon, metric, label, status, statusColor, loaded, delay }: {
  icon: string; metric: string; label: string; status: string; statusColor: string; loaded: boolean; delay: number;
}) => (
  <div
    className={`bg-white rounded-2xl shadow-lg p-5 text-center transition-all duration-500 hover:shadow-xl hover:scale-[1.02] ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
    style={{ transitionDelay: `${delay}ms` }}
  >
    <span className="text-3xl">{icon}</span>
    <p className="text-3xl font-bold text-[#1E3A8A] mt-1">{metric}</p>
    <p className="text-xs text-gray-600 mb-2">{label}</p>
    <span className={`${statusColor} px-2 py-1 rounded text-xs font-bold`}>{status}</span>
  </div>
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

export default Analytics;
