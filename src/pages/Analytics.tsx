import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loadQueue, saveQueue } from "@/utils/queueEngine";
import { BarChart3, TrendingUp, Clock, AlertCircle, Sparkles } from "lucide-react";

interface NoShowItem {
  ticketNumber: string;
  customerName: string;
  calledAt?: string;
}

export default function Analytics() {
  const navigate = useNavigate();
  const [currentPlan, setCurrentPlan] = useState("FREE");
  const [stats, setStats] = useState({
    totalServed: 0,
    totalNoShows: 0,
    noShowRate: 0,
  });
  const [noShowList, setNoShowList] = useState<NoShowItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Authenticate and enforce Tenant Isolation Boundary
    const stored = localStorage.getItem("pila-merchant");
    if (!stored) {
      navigate("/login");
      return;
    }

    const merchant = JSON.parse(stored);
    const currentMerchantId = merchant.id;
    setCurrentPlan(merchant.current_plan || merchant.servicePlan?.toUpperCase() || "FREE");

    // 2. Automated Daily Midnight Local Time Data Reset Trigger
    const queue: any = loadQueue();
    const todayStr = new Date().toLocaleDateString("en-PH");

    if (queue.lastResetDate !== todayStr) {
      console.log("🕛 Midnight detected. Resetting active operational queue metrics...");
      queue.tickets = queue.tickets.map((t: any) => {
        if (t.merchantId === currentMerchantId && t.status === "waiting") {
          return t;
        }
        return { ...t, archived: true };
      });
      queue.lastResetDate = todayStr;
      saveQueue(queue);
    }

    // 3. Filter Tickets strictly matching current Merchant UUID ONLY
    const myTickets = queue.tickets.filter(
      (t: any) => t.merchantId === currentMerchantId && !t.archived
    );

    // 4. Calculate Core Operational Metrics
    const completed = myTickets.filter((t: any) => t.status === "completed");
    const noShows = myTickets.filter((t: any) => t.status === "no_show");

    const totalServed = completed.length;
    const totalNoShows = noShows.length;
    const totalHandled = totalServed + totalNoShows;
    const noShowRate = totalHandled > 0 ? ((totalNoShows / totalHandled) * 100) : 0;

    // 5. Build clean no-show dataset
    const noShowData: NoShowItem[] = noShows.map((t: any) => ({
      ticketNumber: t.ticketNumber,
      customerName: t.customerName || "Anonymous Guest",
      calledAt: t.calledAt || t.called_at,
    }));

    setStats({
      totalServed,
      totalNoShows,
      noShowRate: parseFloat(noShowRate.toFixed(1)),
    });
    setNoShowList(noShowData);
    setLoading(false);
  }, [navigate]);

  if (loading) {
    return (
      <div className="p-8 text-gray-700">
        <p>Loading metrics network...</p>
      </div>
    );
  }

  const isFree = currentPlan === "FREE" || currentPlan === "PANDAY";

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-black text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Real-time performance overview and historical tenant tracking.
          </p>
        </div>

        {/* Metrics Deck */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-gray-700">Total Served</p>
              <TrendingUp size={18} className="text-green-600" />
            </div>
            <p className="text-4xl font-black text-gray-900">{stats.totalServed}</p>
            <p className="text-xs text-gray-500 mt-1">Completed interactions today</p>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-gray-700">No-Shows</p>
              <AlertCircle size={18} className="text-red-600" />
            </div>
            <p className="text-4xl font-black text-gray-900">{stats.totalNoShows}</p>
            <p className="text-xs text-gray-500 mt-1">Missed terminal queue callouts</p>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-gray-700">No-Show Rate</p>
              <BarChart3 size={18} className="text-indigo-600" />
            </div>
            <p className="text-4xl font-black text-gray-900">{stats.noShowRate}%</p>
            <p className="text-xs text-gray-500 mt-1">Total proportional drop rate</p>
          </div>
        </div>

        {/* No-Show History */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">No-Show History Logs</h2>
          {noShowList.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-gray-700">
                    <th className="p-2 font-semibold">Ticket ID</th>
                    <th className="p-2 font-semibold">Customer Reference</th>
                    <th className="p-2 font-semibold">Terminal Call Timestamp</th>
                    <th className="p-2 font-semibold">System Action Status</th>
                  </tr>
                </thead>
                <tbody>
                  {noShowList.map((item, idx) => (
                    <tr key={idx} className="border-b border-gray-100 text-gray-800">
                      <td className="p-2 font-mono">{item.ticketNumber}</td>
                      <td className="p-2">{item.customerName}</td>
                      <td className="p-2 text-gray-600">
                        {item.calledAt
                          ? new Date(item.calledAt).toLocaleString()
                          : "Flagged manually inside workflow"}
                      </td>
                      <td className="p-2">
                        <span className="bg-red-100 text-red-700 px-2 py-1 rounded font-semibold">
                          No-Show
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-900 font-semibold">No dropouts logged</p>
              <p className="text-gray-600 text-sm mt-1">
                All active customers answered terminal prompts cleanly today.
              </p>
            </div>
          )}
        </div>

        {/* Sinag Upgrade Banner */}
        {isFree && (
          <div className="bg-gradient-to-r from-indigo-900 to-blue-900 rounded-xl p-6 text-white">
            <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
              <div>
                <span className="inline-block bg-yellow-400 text-indigo-950 text-xs font-black px-2 py-1 rounded mb-2">
                  SINAG UPGRADE REQUIRED
                </span>
                <h3 className="text-2xl font-bold">Unlock Deep Operational Intelligence</h3>
                <p className="text-blue-100 text-sm mt-2 max-w-2xl">
                  Your profile is tracking base metrics. Upgrade to the Sinag Tier to open
                  interactive data charts, hourly storefront traffic heatmaps, trends, and 1-year
                  historic transactional database lookbacks.
                </p>
              </div>
              <button
                onClick={() => navigate("/pricing")}
                className="bg-white text-indigo-950 hover:bg-blue-50 px-6 py-3 font-bold rounded-lg text-sm shadow transition-all whitespace-nowrap"
              >
                Upgrade to Sinag (₱999/mo)
              </button>
            </div>
          </div>
        )}

        {/* Suri Roadmap */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={20} className="text-purple-600" />
            <h3 className="text-lg font-bold text-gray-900">
              Advanced AI Optimization Engine — WORK IN PROGRESS / COMING SOON
            </h3>
          </div>
          <p className="text-gray-700 text-sm mb-4">
            Our upcoming enterprise tier, Suri (Expert AI), is actively under engineering
            development. We are running model calibration pipelines alongside certified Six Sigma
            Black Belt systems experts to package automated lean operational waste tracking straight
            to your terminal screen.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="border border-gray-200 rounded-lg p-3">
              <p className="font-bold text-gray-900 text-sm">📈 Peak Hour Bottlenecks</p>
              <p className="text-xs text-gray-600 mt-1">
                Automated multi-counter staffing deployment schedules mapped via traffic wave
                metrics.
              </p>
            </div>
            <div className="border border-gray-200 rounded-lg p-3">
              <p className="font-bold text-gray-900 text-sm">🧠 AI Sensei Guidance</p>
              <p className="text-xs text-gray-600 mt-1">
                Real-time alerts warning floor operators to balance standard/express transaction
                ratios dynamically.
              </p>
            </div>
            <div className="border border-gray-200 rounded-lg p-3">
              <p className="font-bold text-gray-900 text-sm">🎯 5-Whys Root Cause</p>
              <p className="text-xs text-gray-600 mt-1">
                Algorithmic post-mortem audits detailing exactly why no-shows spiked during specific
                service slots.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
