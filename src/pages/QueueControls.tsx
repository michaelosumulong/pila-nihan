import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { useLowBattery } from "@/hooks/use-low-battery";
import WalkInModal from "@/components/WalkInModal";
import { addNotification } from "@/lib/notifications";
import OfflineBanner from "@/components/OfflineBanner";
import LowBatteryBanner from "@/components/LowBatteryBanner";
import VersionFooter from "@/components/VersionFooter";
import NoShowTimer from "@/components/NoShowTimer";
import { recordNoShow, isForcedNoShow, getCOPQ } from "@/utils/noShowEngine";

const CATEGORY_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  regular: { bg: "bg-gray-100", text: "text-gray-800", label: "Regular" },
  express: { bg: "bg-green-100", text: "text-green-800", label: "Express" },
  priority: { bg: "bg-yellow-100", text: "text-yellow-800", label: "Priority" },
};

const updateAnalytics = (type: "completed" | "no_show") => {
  const today = new Date().toISOString().split("T")[0];
  const analyticsData = JSON.parse(localStorage.getItem("pila-analytics") || "{}");

  if (!analyticsData[today]) {
    analyticsData[today] = { total_tickets: 0, completed: 0, no_shows: 0, no_show_rate: 0 };
  }

  if (type === "completed") {
    analyticsData[today].completed += 1;
  } else {
    analyticsData[today].no_shows += 1;
  }

  analyticsData[today].total_tickets = analyticsData[today].completed + analyticsData[today].no_shows;
  analyticsData[today].no_show_rate = parseFloat(
    ((analyticsData[today].no_shows / analyticsData[today].total_tickets) * 100).toFixed(1)
  );

  localStorage.setItem("pila-analytics", JSON.stringify(analyticsData));
};

const logQueueAction = (action: Record<string, string>) => {
  const actions = JSON.parse(localStorage.getItem("pila-queue-actions") || "[]");
  actions.push(action);
  localStorage.setItem("pila-queue-actions", JSON.stringify(actions));
};

const QueueControls = () => {
  const navigate = useNavigate();
  const isOnline = useOnlineStatus();
  
  const [showWalkIn, setShowWalkIn] = useState(false);
  const { lowBatteryMode, lastRefresh, toggleLowBattery, manualRefresh } = useLowBattery();
  const buntingCount = 24;

  const handleToggleBattery = () => {
    const newMode = toggleLowBattery();
    if (newMode) {
      toast.success("Battery optimization active", { description: "Auto-refresh paused." });
    } else {
      toast.info("Standard mode restored");
    }
  };

  const [currentServing, setCurrentServing] = useState({
    ticketNumber: "R-055",
    customerName: "Juan Dela Cruz",
    category: "regular",
    waitTime: 8,
    calledAt: new Date().toISOString(),
    servicePace: "standard",
  });

  const [queueList, setQueueList] = useState([
    { id: 1, ticketNumber: "R-056", name: "Maria Santos", category: "regular", waitTime: 12 },
    { id: 2, ticketNumber: "E-012", name: "Pedro Reyes", category: "express", waitTime: 15 },
    { id: 3, ticketNumber: "R-057", name: "Ana Garcia", category: "regular", waitTime: 18 },
    { id: 4, ticketNumber: "P-003", name: "Lola Rosa (Senior)", category: "priority", waitTime: 20 },
    { id: 5, ticketNumber: "R-058", name: "Jose Martinez", category: "regular", waitTime: 22 },
  ]);

  const [servedCount, setServedCount] = useState({ regular: 0, express: 0 });
  const [servedToday, setServedToday] = useState(158);
  const [noShowCount, setNoShowCount] = useState(0);

  const callNext = () => {
    let nextTicket;
    const priorityTicket = queueList.find((t) => t.category === "priority");
    if (priorityTicket) {
      nextTicket = priorityTicket;
    } else if (servedCount.regular >= 2) {
      const expressTicket = queueList.find((t) => t.category === "express");
      nextTicket = expressTicket || queueList.find((t) => t.category === "regular");
    } else {
      nextTicket = queueList.find((t) => t.category === "regular") || queueList[0];
    }

    if (nextTicket) {
      setCurrentServing({
        ticketNumber: nextTicket.ticketNumber,
        customerName: nextTicket.name,
        category: nextTicket.category,
        waitTime: nextTicket.waitTime,
        calledAt: new Date().toISOString(),
        servicePace: nextTicket.category === "express" ? "express" : nextTicket.category === "priority" ? "technical" : "standard",
      });
      setQueueList((prev) => prev.filter((t) => t.id !== nextTicket!.id));
      if (nextTicket.category === "regular") {
        setServedCount((prev) => ({ ...prev, regular: prev.regular + 1 }));
      } else if (nextTicket.category === "express") {
        setServedCount({ regular: 0, express: servedCount.express + 1 });
      }
      setServedToday((prev) => prev + 1);
      toast.success(`Now serving ${nextTicket.ticketNumber} - ${nextTicket.name}`);
      addNotification({
        title: "YOUR TURN!",
        message: `Ticket ${nextTicket.ticketNumber} — please proceed to the counter now.`,
        type: "alert",
        ticketNumber: nextTicket.ticketNumber,
      });
    } else {
      toast.info("Queue is empty!");
    }
  };

  const markServed = () => {
    if (!currentServing.ticketNumber) {
      toast.error("No customer currently being served");
      return;
    }
    updateAnalytics("completed");
    logQueueAction({
      action_type: "completed",
      ticket_number: currentServing.ticketNumber,
      customer_name: currentServing.customerName,
      timestamp: new Date().toISOString(),
    });

    // Clear active ticket if it matches
    try {
      const activeTicket = localStorage.getItem("pila-active-ticket");
      if (activeTicket) {
        const td = JSON.parse(activeTicket);
        if (td.ticketNumber === currentServing.ticketNumber) {
          localStorage.removeItem("pila-active-ticket");
        }
      }
    } catch {}

    toast.success(`${currentServing.ticketNumber} marked as served!`);
    callNext();
  };

  const markNoShow = () => {
    if (!currentServing.ticketNumber) {
      toast.error("No customer currently being served");
      return;
    }

    const forced = isForcedNoShow(currentServing.calledAt);
    const message = forced
      ? `Timer has NOT expired yet. Mark ${currentServing.ticketNumber} as no-show anyway?\n\n(This will be logged as "forced no-show")`
      : `Confirm: Mark ${currentServing.ticketNumber} - ${currentServing.customerName} as No-Show?`;

    if (!confirm(message)) return;

    const loss = getCOPQ(currentServing.servicePace);

    recordNoShow({
      ticketId: `${Date.now()}`,
      ticketNumber: currentServing.ticketNumber,
      customerName: currentServing.customerName,
      servicePace: currentServing.servicePace,
      timeCalled: currentServing.calledAt,
    });

    updateAnalytics("no_show");
    logQueueAction({
      action_type: "no_show",
      ticket_number: currentServing.ticketNumber,
      customer_name: currentServing.customerName,
      timestamp: new Date().toISOString(),
    });

    // Clear active ticket if it matches
    try {
      const activeTicket = localStorage.getItem("pila-active-ticket");
      if (activeTicket) {
        const td = JSON.parse(activeTicket);
        if (td.ticketNumber === currentServing.ticketNumber) {
          localStorage.removeItem("pila-active-ticket");
        }
      }
    } catch {}

    setNoShowCount((prev) => prev + 1);

    if (forced) {
      toast.error("Marked as FORCED no-show (before 30-min deadline)", {
        description: `COPQ: ₱${loss} • This affects customer satisfaction`,
      });
    } else {
      toast.warning(`${currentServing.ticketNumber} marked as No-Show`, {
        description: `COPQ: ₱${loss} lost revenue recorded`,
      });
    }
    callNext();
  };

  const undo = () => {
    toast.info("Previous customer returned to queue");
  };

  const handleWalkInCreated = (ticket: any) => {
    setQueueList((prev) => [
      ...prev,
      {
        id: Date.now(),
        ticketNumber: ticket.ticketNumber,
        name: ticket.customerName,
        category: ticket.category,
        waitTime: ticket.estimatedWaitMinutes,
      },
    ]);
  };

  const cat = CATEGORY_STYLES[currentServing.category] || CATEGORY_STYLES.regular;
  const ordinal = (n: number) => (n === 1 ? "1st" : n === 2 ? "2nd" : n === 3 ? "3rd" : `${n}th`);

  return (
    <div className={`min-h-screen bg-gradient-to-br from-[#0A2569] to-[#1E3A8A] pb-6 p-6 ${!isOnline ? "pt-10" : ""}`}>
      <OfflineBanner isOnline={isOnline} />

      <div className="max-w-6xl mx-auto">
        {/* PAGE HEADER */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[#FFB703] mb-2">
            Queue Controls 🎫
          </h1>
          <p className="text-[#FDFBD4] text-lg">
            Manage your queue and call customers
          </p>
        </div>
        {lowBatteryMode && (
          <LowBatteryBanner lastRefresh={lastRefresh} onRefresh={() => { manualRefresh(); toast.success("Queue refreshed!"); }} />
        )}
        {/* Now Serving */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 text-center">
          <p className="text-gray-600 text-sm uppercase tracking-wider mb-2">Now Serving</p>
          <p className="text-6xl font-bold text-[#1E3A8A] mb-2">{currentServing.ticketNumber}</p>
          <p className="text-xl text-gray-700 mb-2">{currentServing.customerName}</p>
          <span className={`${cat.bg} ${cat.text} rounded-full px-3 py-1 text-sm font-semibold inline-block mb-2`}>
            {cat.label}
          </span>
          <p className="text-sm text-gray-600 mb-3">⏱️ Waited: {currentServing.waitTime} minutes</p>
          {/* No-Show Timer */}
          <div className="flex justify-center">
            <NoShowTimer calledAt={currentServing.calledAt} ticketNumber={currentServing.ticketNumber} />
          </div>
        </div>

        {/* Control Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <button
            onClick={callNext}
            className="col-span-2 bg-[#10B981] text-white font-bold py-4 rounded-xl text-lg shadow-lg active:scale-95 transition-transform"
          >
            📢 Call Next
          </button>
          <button
            onClick={() => setShowWalkIn(true)}
            className="col-span-2 bg-[#3B82F6] text-white font-bold py-3 rounded-xl text-lg shadow-lg active:scale-95 transition-transform hover:bg-[#2563EB]"
          >
            ➕ Add Walk-in (No Phone)
          </button>
          <button
            onClick={markServed}
            className="bg-[#3B82F6] text-white font-bold py-3 rounded-xl text-lg shadow-lg active:scale-95 transition-transform"
          >
            ✅ Mark Served
          </button>
          <button
            onClick={markNoShow}
            className="bg-[#EF4444] text-white font-bold py-3 rounded-xl text-lg shadow-lg active:scale-95 transition-transform"
          >
            ❌ No-Show
          </button>
          <button
            onClick={undo}
            className="col-span-2 bg-[#6B7280] text-white font-bold py-3 rounded-xl text-lg shadow-lg active:scale-95 transition-transform"
          >
            ↩️ Undo
          </button>
        </div>

        {/* Waiting List */}
        <div className="bg-white rounded-2xl shadow-lg p-5 mb-6">
          <h3 className="font-bold text-lg mb-4 text-gray-800">Waiting List</h3>
          {queueList.length === 0 ? (
            <p className="text-gray-400 text-center py-4">Queue is empty 🎉</p>
          ) : (
            <div className="space-y-3">
              {queueList.map((ticket, idx) => {
                const tc = CATEGORY_STYLES[ticket.category] || CATEGORY_STYLES.regular;
                return (
                  <div key={ticket.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-gray-400 w-6">{ordinal(idx + 1)}</span>
                      <div>
                        <p className="font-semibold text-gray-800">{ticket.ticketNumber}</p>
                        <p className="text-sm text-gray-500">{ticket.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`${tc.bg} ${tc.text} text-xs font-semibold px-2.5 py-0.5 rounded-full`}>
                        {tc.label}
                      </span>
                      <span className="text-xs text-gray-400">{ticket.waitTime} min</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-5 gap-3 mb-6">
          <div className="bg-white rounded-xl shadow p-4 text-center">
            <p className="text-2xl font-bold text-[#1E3A8A]">{queueList.length}</p>
            <p className="text-xs text-gray-500">In Queue</p>
          </div>
          <div className="bg-white rounded-xl shadow p-4 text-center">
            <p className="text-2xl font-bold text-[#10B981]">{servedToday}</p>
            <p className="text-xs text-gray-500">Served</p>
          </div>
          <div className="bg-white rounded-xl shadow p-4 text-center">
            <p className="text-2xl font-bold text-[#EF4444]">{noShowCount}</p>
            <p className="text-xs text-gray-500">No-Shows</p>
          </div>
          <div className="bg-white rounded-xl shadow p-4 text-center">
            <p className="text-2xl font-bold text-[#FFB703]">8 min</p>
            <p className="text-xs text-gray-500">Avg Wait</p>
          </div>
          <div className="bg-white rounded-xl shadow p-4 text-center">
            <p className={`text-lg font-bold ${isOnline ? "text-[#10B981]" : "text-[#FFB703]"}`}>
              {isOnline ? "✓" : "⚠️"}
            </p>
            <p className="text-xs text-gray-500">{isOnline ? "Online" : "Offline"}</p>
          </div>
        </div>

        <VersionFooter />
      </div>

      {/* Walk-in Modal */}
      <WalkInModal open={showWalkIn} onClose={() => setShowWalkIn(false)} onTicketCreated={handleWalkInCreated} />

    </div>
  );
};


export default QueueControls;
