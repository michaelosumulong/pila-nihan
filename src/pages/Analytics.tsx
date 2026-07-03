import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Users } from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { useLowBattery } from "@/hooks/use-low-battery";
import LowBatteryBanner from "@/components/LowBatteryBanner";
import FiveWhysModal from "@/components/FiveWhysModal";
import PendingAudits from "@/components/PendingAudits";
import VersionFooter from "@/components/VersionFooter";
import { getCOPQ, type NoShowRecord } from "@/utils/noShowEngine";
import { loadQueue, type Ticket } from "@/utils/queueEngine";
const HOURS = ["8 AM","9 AM","10 AM","11 AM","12 PM","1 PM","2 PM","3 PM","4 PM","5 PM"];
const DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

interface NoShowDisplayItem {
  ticketNumber: string;
  customerName: string;
  createdAt: string;
  calledAt?: string;
  status: string;
}

const Analytics = () => {
  const navigate = useNavigate();

  // GUARD: Check for merchant session on mount
  useEffect(() => {
    const merchant = JSON.parse(localStorage.getItem('pila-merchant') || '{}');
    if (!merchant.id) {
      console.error('❌ No merchant session found - redirecting to login');
      toast.error('Session expired. Please log in again.');
      navigate('/login');
      return;
    }
    console.log('✅ Merchant session verified:', merchant.businessName);
  }, [navigate]);

  const [loaded, setLoaded] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [noShowData, setNoShowData] = useState<NoShowDisplayItem[]>([]);
  const [analyticsStats, setAnalyticsStats] = useState({
    totalServed: 0,
    totalNoShows: 0,
    noShowRate: 0,
  });
  const [showFiveWhys, setShowFiveWhys] = useState(false);
  const [fiveWhysIssue, setFiveWhysIssue] = useState("");
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
    // Get current merchant
    const stored = localStorage.getItem('pila-merchant');
    if (!stored) {
      navigate('/login');
      return;
    }

    const merchant = JSON.parse(stored);
    const currentMerchantId = merchant.id;
    if (!currentMerchantId) {
      navigate('/login');
      return;
    }

    // Load queue
    const queue = loadQueue();

    // STEP 1: Filter to current merchant ONLY
    const myTickets: Ticket[] = [];
    for (let i = 0; i < queue.tickets.length; i++) {
      if (queue.tickets[i].merchantId === currentMerchantId) {
        myTickets.push(queue.tickets[i]);
      }
    }

    // STEP 2: Calculate analytics from myTickets ONLY
    const completed = myTickets.filter(t => t.status === 'completed');
    const noShows = myTickets.filter(t => t.status === 'no_show');
    const handledTotal = completed.length + noShows.length;

    // STEP 3: Build no-show data array for display
    const noShowList = noShows.map(t => ({
      ticketNumber: t.ticketNumber,
      customerName: t.customerName,
      createdAt: t.created_at,
      calledAt: t.called_at,
      status: t.status,
    }));

    setTickets(myTickets);
    setNoShowData(noShowList);
    setAnalyticsStats({
      totalServed: completed.length,
      totalNoShows: noShows.length,
      noShowRate: handledTotal > 0 ? Number(((noShows.length / handledTotal) * 100).toFixed(1)) : 0,
    });


    setTimeout(() => setLoaded(true), 100);
  }, [navigate]);


  const today = new Date().toISOString().split("T")[0];
  const servedToday = tickets.filter((t) => t.status === "completed" && t.served_at?.startsWith(today));
  const totalServedToday = servedToday.length;

  // Explicit No-Show Data Isolation: derive from the merchant-filtered tickets array only
  const noShowToday = tickets.filter((t) => t.status === 'no_show' && t.created_at?.startsWith(today));
  const totalHandledToday = totalServedToday + noShowToday.length;
  const noShowStats = {
    count: noShowToday.length,
    rate: totalHandledToday > 0 ? parseFloat(((noShowToday.length / totalHandledToday) * 100).toFixed(1)) : 0,
    totalServed: totalServedToday,
  };

  const expressRevenueToday = tickets
    .filter((t) => t.priorityPaid && t.served_at?.startsWith(today))
    .reduce((s, t) => s + (t.priorityAmount || 0), 0);
  const merchantRevenue = Math.round(expressRevenueToday * 0.4);
  const platformRevenue = expressRevenueToday - merchantRevenue;
  const avgHandlingMin =
    servedToday.length > 0
      ? servedToday.reduce((s, t) => {
          if (t.called_at && t.served_at) {
            return s + (new Date(t.served_at).getTime() - new Date(t.called_at).getTime()) / 60000;
          }
          return s;
        }, 0) / servedToday.length
      : 0;

  const hourlyData = HOURS.map((label, i) => {
    const hour = 8 + i;
    const count = tickets.filter((t) => {
      if (!t.created_at?.startsWith(today)) return false;
      return new Date(t.created_at).getHours() === hour;
    }).length;
    return { hour: label, customers: count };
  });

  const trendData = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().split("T")[0];
    const dayServed = tickets.filter((t) => t.status === "completed" && t.served_at?.startsWith(key));
    const avg =
      dayServed.length > 0
        ? dayServed.reduce((s, t) => {
            if (t.called_at && t.served_at) {
              return s + (new Date(t.served_at).getTime() - new Date(t.called_at).getTime()) / 60000;
            }
            return s;
          }, 0) / dayServed.length
        : 0;
    return { day: DAYS[i], waitTime: parseFloat(avg.toFixed(1)) };
  });

  const noShowBadge = noShowStats.rate < 5
    ? { label: "EXCELLENT", cls: "bg-green-100 text-green-800" }
    : noShowStats.rate < 10
    ? { label: "STABLE", cls: "bg-yellow-100 text-yellow-800" }
    : { label: "NEEDS ATTENTION", cls: "bg-red-100 text-red-800" };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A2569] to-[#1E3A8A] pb-6 p-6">

      <div className="max-w-6xl mx-auto">
        {/* PAGE HEADER */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[#FFB703] mb-2">
            📊 Analytics Dashboard
          </h1>
          <p className="text-[#FDFBD4] text-lg">
            Advanced insights and performance metrics
          </p>
        </div>
        {lowBatteryMode && (
          <LowBatteryBanner lastRefresh={lastRefresh} onRefresh={() => { manualRefresh(); toast.success("Analytics refreshed!"); }} />
        )}

        {/* PENDING AUDITS - TOP PRIORITY SECTION */}
        <div className="mb-6">
          <PendingAudits
            onAnalyze={(desc) => {
              setFiveWhysIssue(desc);
              setShowFiveWhys(true);
            }}
          />
        </div>

        {/* Action buttons */}
        <div className="flex justify-end gap-2 mb-4">
          <button
            onClick={() => navigate('/')}
            className="bg-[#FFB703] text-[#0A2569] text-sm font-bold px-4 py-2 rounded-lg shadow hover:shadow-md flex items-center gap-2 transition-colors"
            title="Go to Guest Portal"
          >
            <Users size={16} />
            Guest Portal
          </button>
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

        {/* No-show analytics display */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-gray-600">Total Served</p>
            <p className="text-3xl font-bold text-[#1E3A8A]">{analyticsStats.totalServed}</p>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-gray-600">No-Shows</p>
            <p className="text-3xl font-bold text-red-600">{analyticsStats.totalNoShows}</p>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-gray-600">No-Show Rate</p>
            <p className="text-3xl font-bold text-[#1E3A8A]">{analyticsStats.noShowRate}%</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6 overflow-x-auto">
          <h3 className="text-lg font-bold mb-4 text-[#1E3A8A]">No-Show History</h3>
          {noShowData.length > 0 ? (
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Ticket</th>
                  <th className="text-left p-2">Customer</th>
                  <th className="text-left p-2">Created</th>
                  <th className="text-left p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {noShowData.map(item => (
                  <tr key={`${item.ticketNumber}-${item.createdAt}`} className="border-b hover:bg-gray-50">
                    <td className="p-2 font-bold">{item.ticketNumber}</td>
                    <td className="p-2">{item.customerName}</td>
                    <td className="p-2 text-sm">{new Date(item.createdAt).toLocaleString()}</td>
                    <td className="p-2"><span className="bg-red-100 text-red-700 px-2 py-1 rounded">No-Show</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-500 text-center py-8">No no-shows recorded</p>
          )}
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <MetricCard
            icon="👥" value={String(totalServedToday)} label="Clients Served Today"
            valueColor="text-[#1E3A8A]"
            delay={0} loaded={loaded}
          />
          <MetricCard
            icon="⏱️" value={avgHandlingMin > 0 ? `${avgHandlingMin.toFixed(1)} min` : "—"} label="Avg Handling Time"
            valueColor="text-[#10B981]"
            extra={
              <p className="text-xs text-gray-500 mt-1">Target: &lt;10 min</p>
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
            icon="💰" value={`₱${expressRevenueToday.toLocaleString()}`} label="Express Revenue Today"
            valueColor="text-[#3B82F6]"
            extra={
              <p className="text-xs text-gray-500 mt-1">Merchant: ₱{merchantRevenue.toLocaleString()} | Platform: ₱{platformRevenue.toLocaleString()}</p>
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
            {hourlyData.every((h) => h.customers === 0) && (
              <p className="text-sm text-gray-400 mt-3 text-center">No customer activity yet today</p>
            )}
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
            {trendData.every((d) => d.waitTime === 0) && (
              <p className="text-sm text-gray-400 mt-3 text-center">No wait time data yet</p>
            )}
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

          {totalServedToday === 0 ? (
            <p className="text-sm text-gray-500 italic">
              Insights will appear once you start serving customers. Process at least a few tickets to unlock Lean Six Sigma recommendations.
            </p>
          ) : (
            <>
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">📈</span>
                  <h4 className="font-bold text-[#3B82F6]">Takt Time Observation</h4>
                </div>
                <p className="text-sm text-gray-700">
                  Average handling time today: <strong>{avgHandlingMin.toFixed(1)} min</strong> across {totalServedToday} served customer(s).
                  {avgHandlingMin > 0 && avgHandlingMin < 10 && " You have capacity to serve more customers without degrading quality."}
                </p>
              </div>
            </>
          )}

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

        {/* Customer Satisfaction */}
        {(() => {
          const feedback = JSON.parse(localStorage.getItem("customer_feedback") || "[]");
          const today = new Date().toISOString().split("T")[0];
          const todayFeedback = feedback.filter((f: any) => f.date === today);
          const positiveCount = todayFeedback.filter((f: any) => f.rating === "positive").length;
          const satisfactionRate = todayFeedback.length > 0
            ? ((positiveCount / todayFeedback.length) * 100).toFixed(0)
            : "—";
          return (
            <div className="grid grid-cols-1 gap-4 mb-6">
              <div className="bg-white rounded-xl shadow-lg p-4 border-l-4 border-[#10B981]">
                <div className="text-3xl font-bold text-[#10B981]">
                  {satisfactionRate}{typeof satisfactionRate === "string" && satisfactionRate !== "—" ? "%" : satisfactionRate === "—" ? "" : "%"}
                </div>
                <div className="text-sm text-gray-600 mt-1">Customer Satisfaction</div>
                <div className="text-xs text-gray-500 mt-1">
                  {todayFeedback.length > 0
                    ? `${positiveCount}/${todayFeedback.length} positive today`
                    : "No feedback yet today"}
                </div>
              </div>
            </div>
          );
        })()}




        {/* No-Show Intelligence */}
        {(() => {
          // Explicit No-Show Data Isolation: compute exclusively from the merchant-filtered tickets array
          const nsMetrics = {
            count: noShowToday.length,
            rate: totalHandledToday > 0 ? parseFloat(((noShowToday.length / totalHandledToday) * 100).toFixed(1)) : 0,
            totalLost: noShowToday.reduce((sum, t) => sum + (t.estimatedLoss || getCOPQ(t.servicePace || 'standard')), 0),
            projectedMonthly: 0,
            projectedYearly: 0,
            history: noShowToday.slice(0, 10).map((t): NoShowRecord => ({
              ticketId: t.id,
              ticketNumber: t.ticketNumber,
              customerName: t.customerName,
              servicePace: t.servicePace || 'standard',
              timeCalled: t.called_at || t.created_at,
              timeMarkedNoShow: t.created_at,
              estimatedLoss: t.estimatedLoss || getCOPQ(t.servicePace || 'standard'),
              forced: false,
            })),
            forcedCount: 0,
            forcedPercentage: 0,
          };

          const hours = noShowToday.map((t) => new Date(t.called_at || t.created_at).getHours());
          const hourCounts: Record<number, number> = {};
          hours.forEach((h) => (hourCounts[h] = (hourCounts[h] || 0) + 1));
          const peakHour = Object.keys(hourCounts).length > 0
            ? Object.keys(hourCounts).reduce((a, b) => hourCounts[parseInt(a)] > hourCounts[parseInt(b)] ? a : b)
            : '0';
          const noShowsByPace: Record<string, number> = {};
          noShowToday.forEach((t) => {
            noShowsByPace[t.servicePace || 'standard'] = (noShowsByPace[t.servicePace || 'standard'] || 0) + 1;
          });
          const worstPace = Object.keys(noShowsByPace).length > 0
            ? Object.keys(noShowsByPace).reduce((a, b) => noShowsByPace[a] > noShowsByPace[b] ? a : b)
            : 'standard';
          const nsAnalysis = {
            peakHour: parseInt(peakHour),
            worstPace,
            totalForced: 0,
            forcedRate: 0,
          };
          const merchantRaw = localStorage.getItem("pila-merchant");
          const merchantData = merchantRaw ? JSON.parse(merchantRaw) : null;
          return (
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <h3 className="text-xl font-bold text-[#1E3A8A] mb-4">🚫 No-Show Intelligence</h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div className="bg-red-50 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-red-600">{nsMetrics.count}</p>
                  <p className="text-xs text-gray-500">Today's No-Shows</p>
                </div>
                <div className="bg-orange-50 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-orange-600">{nsMetrics.rate}%</p>
                  <p className="text-xs text-gray-500">No-Show Rate</p>
                </div>
                <div className="bg-red-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-red-700">₱{nsMetrics.totalLost.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">COPQ Today</p>
                </div>
                <div className="bg-yellow-50 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-yellow-600">{nsMetrics.forcedPercentage}%</p>
                  <p className="text-xs text-gray-500">Forced Early</p>
                </div>
              </div>

              {nsAnalysis && merchantData?.plan === 'SURI' && (
                <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded-lg mb-4">
                  <p className="font-bold text-purple-700 mb-2">🤖 SURI AI Insights:</p>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Peak no-show hour: {nsAnalysis.peakHour}:00</li>
                    <li>• Worst service pace: {nsAnalysis.worstPace}</li>
                    <li>• Forced no-shows: {nsAnalysis.forcedRate}% (may hurt satisfaction)</li>
                  </ul>
                </div>
              )}

              <div>
                <h4 className="font-bold text-gray-700 text-sm mb-3">Recent No-Shows:</h4>
                {nsMetrics.history.length > 0 ? (
                  <div className="space-y-2">
                    {nsMetrics.history.slice(0, 5).map((ns: NoShowRecord, idx: number) => (
                      <div key={idx} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-2">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-gray-800">{ns.ticketNumber}</span>
                          <span className="text-sm text-gray-500">{ns.customerName}</span>
                          {ns.forced && (
                            <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full font-bold">FORCED</span>
                          )}
                        </div>
                        <span className="text-red-600 font-bold">-₱{ns.estimatedLoss}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-400 py-4">No no-shows recorded yet today ✅</p>
                )}
              </div>
            </div>
          );
        })()}

        {/* Performance Scorecard */}
        {(() => {
          const within15 = servedToday.filter((t) => {
            if (!t.called_at || !t.served_at) return false;
            return (new Date(t.served_at).getTime() - new Date(t.called_at).getTime()) / 60000 <= 15;
          }).length;
          const within15Pct = totalServedToday > 0 ? Math.round((within15 / totalServedToday) * 100) : 0;
          const expressTickets = servedToday.filter((t) => t.priorityPaid).length;
          const expressPct = totalServedToday > 0 ? Math.round((expressTickets / totalServedToday) * 100) : 0;
          return (
            <div className="grid grid-cols-3 gap-4 mb-6">
              <ScoreCard icon="🎯" metric={`${within15Pct}%`} label="Within 15-min Target" status={within15Pct >= 90 ? "EXCELLENT" : within15Pct >= 70 ? "GOOD" : "NEEDS WORK"} statusColor={within15Pct >= 90 ? "bg-green-100 text-green-800" : within15Pct >= 70 ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"} loaded={loaded} delay={700} />
              <ScoreCard icon="⚡" metric={`${expressPct}%`} label="Express Upgrade Rate" status={expressPct > 0 ? "TRACKED" : "NONE YET"} statusColor="bg-blue-100 text-blue-800" loaded={loaded} delay={800} />
              <ScoreCard icon="📊" metric={String(totalServedToday)} label="Served Today" status={totalServedToday > 0 ? "ACTIVE" : "NO DATA"} statusColor="bg-[#FFF9E6] text-[#B8860B]" loaded={loaded} delay={900} />
            </div>
          );
        })()}

        <VersionFooter />
      </div>

      <FiveWhysModal open={showFiveWhys} onClose={() => { setShowFiveWhys(false); setFiveWhysIssue(""); }} initialIssue={fiveWhysIssue} />
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


export default Analytics;
