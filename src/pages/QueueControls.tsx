import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Users } from "lucide-react";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { useLowBattery } from "@/hooks/use-low-battery";
import WalkInModal from "@/components/WalkInModal";
import { addNotification } from "@/lib/notifications";
import OfflineBanner from "@/components/OfflineBanner";
import LowBatteryBanner from "@/components/LowBatteryBanner";
import VersionFooter from "@/components/VersionFooter";
import NoShowTimer from "@/components/NoShowTimer";
import { recordNoShow, isForcedNoShow, getCOPQ } from "@/utils/noShowEngine";
import { loadQueue, saveQueue, fetchQueue, updateTicketStatus, subscribeToQueue, type Ticket, type Queue } from "@/utils/queueEngine";

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

const mapQueueTicket = (ticket: any) => ({
  id: ticket.id,
  ticketNumber: ticket.ticketNumber,
  name: ticket.customerName,
  customerName: ticket.customerName,
  category: ticket.category || ticket.servicePace || "regular",
  servicePace: ticket.servicePace || "regular",
  calledAt: ticket.called_at,
  waitTime: ticket.estimatedWaitMinutes || 0,
});

const mapServingTicket = (ticket: any) => ({
  id: ticket.id,
  ticketNumber: ticket.ticketNumber,
  customerName: ticket.customerName,
  category: ticket.category || ticket.servicePace || "regular",
  waitTime: ticket.estimatedWaitMinutes || 0,
  calledAt: ticket.called_at || new Date().toISOString(),
  servicePace: ticket.servicePace || "standard",
  status: ticket.status || "waiting",
});

const QueueControls = () => {
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

  const [currentServing, setCurrentServing] = useState<{
    id: string;
    ticketNumber: string;
    customerName: string;
    category: string;
    waitTime: number;
    calledAt: string;
    servicePace: string;
    status: string;
  }>({
    id: "",
    ticketNumber: "",
    customerName: "",
    category: "regular",
    waitTime: 0,
    calledAt: new Date().toISOString(),
    servicePace: "regular",
    status: "",
  });

  const [queueList, setQueueList] = useState<Array<{ id: string; ticketNumber: string; name: string; customerName: string; category: string; servicePace: string; calledAt?: string; waitTime: number }>>([]);
  const [queueData, setQueueData] = useState<Queue>(() => loadQueue());

  // Real-time sync via Supabase: initial fetch + realtime subscription
  useEffect(() => {
    // Resolve merchantId from active merchant session (UUID), fall back to undefined.
    let merchantId: string | undefined;
    try {
      const raw = localStorage.getItem("pila-merchant");
      if (raw) {
        const m = JSON.parse(raw);
        if (m?.id && /^[0-9a-f-]{36}$/i.test(m.id)) merchantId = m.id;
      }
    } catch {}

    const applyQueue = (fresh: Queue) => {
      console.log("📊 Queue received:", fresh.tickets.length, "tickets");
      console.table(
        fresh.tickets.map((t) => ({
          ticket: t.ticketNumber,
          customer: t.customerName,
          status: t.status || "waiting",
        }))
      );
      setQueueData(fresh);
      const waiting = fresh.tickets.filter((t: Ticket) => t.status === "waiting" || !t.status);
      console.log("⏳ Waiting:", waiting.length);
      setQueueList(waiting.map(mapQueueTicket));
      const active = fresh.tickets.find((t: Ticket) => t.status === "called" || t.status === "serving");
      if (active) setCurrentServing(mapServingTicket(active));
    };

    console.log("🔄 Fetching queue from Supabase (merchantId:", merchantId || "ALL", ")");
    fetchQueue(merchantId)
      .then((queue) => {
        console.log("✅ Initial fetchQueue complete:", queue.tickets.length);
        applyQueue(queue);
      })
      .catch((err) => {
        console.error("❌ fetchQueue failed:", err);
        toast.error("Failed to load queue. Check your connection.");
      });

    if (!lowBatteryMode) {
      console.log("📡 Setting up realtime subscription...");
      const unsubscribe = subscribeToQueue(merchantId, applyQueue);
      return unsubscribe;
    }
  }, [lowBatteryMode]);

  const [servedCount, setServedCount] = useState({ regular: 0, express: 0 });
  const [noShowCount, setNoShowCount] = useState(0);

  // Today's stats from real queue data
  const servedToday = queueData.tickets.filter((t: Ticket) => t.status === "completed").length;
  const cancelledToday = queueData.tickets.filter((t: Ticket) => t.status === "cancelled").length;

  const callNext = async () => {
    console.log('═══════════════════════════════════════');
    console.log('📢 CALL NEXT INITIATED');
    console.log('═══════════════════════════════════════');
    console.log('currentServing:', currentServing);
    console.log('currentServing?.id:', currentServing?.id);
    console.log('currentServing?.status:', currentServing?.status);

    // GUARD: Check if someone is already being served
    const queue = loadQueue();
    const activeTicket = queue.tickets.find((t: Ticket) => t.status === 'called' || t.status === 'serving');
    console.log('activeTicket from queue:', activeTicket?.ticketNumber, activeTicket?.status);

    if (activeTicket) {
      console.log('⚠️ GUARD TRIGGERED - Previous ticket still active:', activeTicket.ticketNumber);
      
      const confirmed = window.confirm(
        `${activeTicket.ticketNumber} is still being served.\n\n` +
        `Click OK to mark as served and call next customer.\n` +
        `Click Cancel to continue with ${activeTicket.ticketNumber}.`
      );
      
      if (!confirmed) {
        console.log('User chose to continue serving:', activeTicket.ticketNumber);
        toast.info(`Continuing with ${activeTicket.ticketNumber}`);
        return;
      }
      
      // Auto-mark previous ticket as completed
      console.log('🔄 Auto-completing:', activeTicket.ticketNumber);
      
      try {
        const ok = await updateTicketStatus(activeTicket.id, 'completed', {
          served_at: new Date().toISOString(),
        });
        if (!ok) {
          console.error('❌ Failed to auto-complete');
          toast.error('Failed to mark as served. Please try again.');
          return;
        }
        console.log('✅ Auto-completed:', activeTicket.ticketNumber);
        
        updateAnalytics('completed');
        logQueueAction({
          action_type: 'completed',
          ticket_number: activeTicket.ticketNumber,
          customer_name: activeTicket.customerName || '',
          timestamp: new Date().toISOString(),
        });
        
      } catch (err: any) {
        console.error('Auto-complete error:', err);
        toast.error('Error: ' + (err.message || 'Unknown'));
        return;
      }
    } else {
      console.log('✅ No guard needed - no active ticket, can call next');
    }

    // NOW call the next customer
    console.log('📢 Calling next customer...');
    
    const freshQueue = loadQueue();
    const waitingTickets = freshQueue.tickets.filter((t: Ticket) => t.status === 'waiting' || !t.status);

    if (waitingTickets.length === 0) {
      toast.info('Queue is empty! No more customers.');
      return;
    }

    let nextTicket = waitingTickets.find((t: Ticket) => t.servicePace === 'priority');
    if (!nextTicket) {
      nextTicket = servedCount.regular >= 2
        ? waitingTickets.find((t: Ticket) => t.servicePace === 'express') || waitingTickets.find((t: Ticket) => t.servicePace === 'regular')
        : waitingTickets.find((t: Ticket) => t.servicePace === 'regular') || waitingTickets[0];
    }

    if (nextTicket) {
      const ok = await updateTicketStatus(nextTicket.id, 'called', {
        called_at: new Date().toISOString(),
        servicePace: nextTicket.servicePace || 'regular',
      });

      if (!ok) {
        toast.error('Failed to call next ticket. Check your connection.');
        return;
      }

      // Realtime subscription will push the update; also refresh locally for snappy UX
      const updated = loadQueue();
      setQueueData(updated);
      const updatedTicket = updated.tickets.find((t) => t.id === nextTicket!.id);
      if (updatedTicket) setCurrentServing(mapServingTicket(updatedTicket));
      setQueueList(updated.tickets.filter((t) => t.status === 'waiting' || !t.status).map(mapQueueTicket));

      if (nextTicket.servicePace === 'regular') {
        setServedCount((prev) => ({ ...prev, regular: prev.regular + 1 }));
      } else if (nextTicket.servicePace === 'express') {
        setServedCount({ regular: 0, express: servedCount.express + 1 });
      }

      toast.success(`Now serving ${nextTicket.ticketNumber} - ${nextTicket.customerName}`);
      console.log('📢 Called ticket:', nextTicket.ticketNumber, '| Service:', nextTicket.servicePace);

      addNotification({
        title: 'YOUR TURN!',
        message: `Ticket ${nextTicket.ticketNumber} — please proceed to the counter now.`,
        type: 'alert',
        ticketNumber: nextTicket.ticketNumber,
      });
    }
  };

  const markServed = async () => {
    if (!currentServing || !currentServing.ticketNumber) {
      toast.error("No customer currently being served");
      return;
    }

    try {
      const queue = loadQueue();
      const ticket = queue.tickets.find((t) => t.ticketNumber === currentServing.ticketNumber);

      if (!ticket) {
        toast.error("Ticket not found in queue");
        return;
      }

      const calledAt = ticket.called_at || new Date(Date.now() - 60000).toISOString();
      const servedAt = new Date().toISOString();

      console.log("🔄 Marking ticket as served:", ticket.id, ticket.ticketNumber);

      // CRITICAL: snake_case keys to match PostgreSQL columns
      const ok = await updateTicketStatus(ticket.id, "completed", {
        called_at: calledAt,
        served_at: servedAt,
      });

      if (!ok) {
        console.error("❌ updateTicketStatus returned false for", ticket.id);
        toast.error("Failed to update ticket. Check Supabase RLS policies for tickets table.");
        return;
      }

      console.log("✅ Ticket marked as served:", ticket.ticketNumber);
      const serviceTime = (new Date(servedAt).getTime() - new Date(calledAt).getTime()) / 1000;
      console.log("   Service time:", Math.round(serviceTime), "seconds");

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
      } catch (e) {
        console.error("Error clearing active ticket:", e);
      }

      toast.success(`${currentServing.ticketNumber} marked as served!`);
      callNext();
    } catch (err: any) {
      console.error("❌ markServed error:", err);
      toast.error("Failed to mark as served: " + (err?.message || "Unknown error"));
    }
  };

  const markNoShow = async (ticket: any) => {
    if (!ticket || !ticket.ticketNumber) {
      toast.error("No customer selected");
      return;
    }

    const forced = isForcedNoShow(ticket.calledAt);
    const message = forced
      ? `Timer has NOT expired yet. Mark ${ticket.ticketNumber} as no-show anyway?\n\n(This will be logged as "forced no-show")`
      : `Confirm: Mark ${ticket.ticketNumber} - ${ticket.customerName} as No-Show?`;

    if (!confirm(message)) return;

    console.log('🚫 MARK NO-SHOW CLICKED:', ticket.ticketNumber);

    try {
      // Step 1: Update in Supabase
      console.log('☁️ Updating Supabase...');
      const ok = await updateTicketStatus(ticket.id, 'no_show', {
        cancelled_at: new Date().toISOString(),
      });

      if (!ok) {
        console.error('❌ Supabase update failed');
        toast.error('Failed to mark no-show');
        return;
      }

      console.log('✅ Supabase updated');

      // Step 2: Update localStorage
      console.log('💾 Updating localStorage...');
      const queue = loadQueue();
      const idx = queue.tickets.findIndex((t: any) => t.id === ticket.id);

      if (idx !== -1) {
        queue.tickets[idx].status = 'no_show';
        queue.tickets[idx].cancelledAt = new Date().toISOString();
        saveQueue(queue);
        console.log('✅ localStorage updated');
      }

      // Step 3: Record no-show analytics
      recordNoShow({
        ticketId: ticket.id,
        ticketNumber: ticket.ticketNumber,
        customerName: ticket.customerName,
        servicePace: ticket.servicePace,
        timeCalled: ticket.calledAt,
      });

      updateAnalytics("no_show");
      logQueueAction({
        action_type: "no_show",
        ticket_number: ticket.ticketNumber,
        customer_name: ticket.customerName,
        timestamp: new Date().toISOString(),
      });

      // Clear active ticket if it matches
      try {
        const activeTicket = localStorage.getItem("pila-active-ticket");
        if (activeTicket) {
          const td = JSON.parse(activeTicket);
          if (td.ticketNumber === ticket.ticketNumber) {
            localStorage.removeItem("pila-active-ticket");
          }
        }
      } catch {}

      // Step 4: Update UI state
      console.log('🎨 Updating UI state...');
      const updated = loadQueue();
      const waiting = updated.tickets.filter((t: any) => t.status === "waiting" || !t.status);
      setQueueList(waiting.map(mapQueueTicket));
      setQueueData(updated);
      setNoShowCount((prev) => prev + 1);

      console.log('✅ UI updated');

      const loss = getCOPQ(ticket.servicePace);
      if (forced) {
        toast.error("Marked as FORCED no-show (before 30-min deadline)", {
          description: `COPQ: ₱${loss} • This affects customer satisfaction`,
        });
      } else {
        toast.warning(`${ticket.ticketNumber} marked as No-Show`, {
          description: `COPQ: ₱${loss} lost revenue recorded`,
        });
      }

      // Auto-call next if this was the current serving ticket
      if (currentServing.ticketNumber === ticket.ticketNumber) {
        callNext();
      }
    } catch (err: any) {
      console.error('❌ Error marking no-show:', err);
      toast.error('Error: ' + (err.message || 'Unknown'));
    }
  };

  const undo = () => {
    toast.info("Previous customer returned to queue");
  };

  const handleWalkInCreated = (ticket: any) => {
    // Walk-in is already saved to localStorage by WalkInModal — refresh from storage
    const fresh = loadQueue();
    setQueueData(fresh);
    setQueueList(fresh.tickets.filter((t: Ticket) => t.status === "waiting" || !t.status).map(mapQueueTicket));
  };

  const cat = CATEGORY_STYLES[currentServing.category] || CATEGORY_STYLES.regular;
  const ordinal = (n: number) => (n === 1 ? "1st" : n === 2 ? "2nd" : n === 3 ? "3rd" : `${n}th`);

  return (
    <div className={`min-h-screen bg-gradient-to-br from-[#0A2569] to-[#1E3A8A] pb-6 p-6 ${!isOnline ? "pt-10" : ""}`}>
      <OfflineBanner isOnline={isOnline} />

      <div className="max-w-6xl mx-auto">
        {/* PAGE HEADER */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-[#FFB703] mb-2">
              Queue Controls 🎫
            </h1>
            <p className="text-[#FDFBD4] text-lg">
              Manage your queue and call customers
            </p>
          </div>
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
            onClick={() => markNoShow(currentServing)}
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
                      <button
                        onClick={() => markNoShow(ticket)}
                        className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                      >
                        ❌ No-Show
                      </button>
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
            <p className="text-2xl font-bold text-[#FFB703]">{(() => {
              const served = queueData.tickets.filter((t) => t.status === "completed" && t.called_at && t.served_at);
              if (served.length === 0) return "—";
              const avg = served.reduce((s, t) => s + (new Date(t.served_at!).getTime() - new Date(t.called_at!).getTime()) / 60000, 0) / served.length;
              return `${avg.toFixed(1)} min`;
            })()}</p>
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
