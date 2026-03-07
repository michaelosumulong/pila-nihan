import { useState, useEffect } from "react";

interface BacklogItem {
  id: string;
  type: "excessive_handling" | "idle_time";
  ticket?: string;
  customer?: string;
  actual?: number;
  target?: number;
  variance?: number;
  gap?: number;
  before?: string;
  after?: string;
  timestamp: string;
  analyzed: boolean;
}

interface PendingAuditsProps {
  onAnalyze: (issueDescription: string) => void;
}

const PendingAudits = ({ onAnalyze }: PendingAuditsProps) => {
  const [items, setItems] = useState<BacklogItem[]>([]);

  useEffect(() => {
    const tickets = JSON.parse(localStorage.getItem("tickets") || "[]");
    const merchant = JSON.parse(localStorage.getItem("pila-merchant") || "{}");
    const targetTime = merchant.targetHandlingTime || 8;
    const today = new Date().toISOString().split("T")[0];
    const backlog: BacklogItem[] = [];

    // Excessive handling times
    tickets
      .filter((t: any) => t.status === "served" && t.served_at?.startsWith(today))
      .forEach((ticket: any) => {
        if (ticket.served_at && ticket.called_at) {
          const handlingTime =
            (new Date(ticket.served_at).getTime() - new Date(ticket.called_at).getTime()) / 1000 / 60;
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
              analyzed: false,
            });
          }
        }
      });

    // Idle gaps (15+ min)
    const served = tickets
      .filter((t: any) => t.status === "served" && t.served_at?.startsWith(today))
      .sort((a: any, b: any) => new Date(a.served_at).getTime() - new Date(b.served_at).getTime());

    for (let i = 1; i < served.length; i++) {
      const gap =
        (new Date(served[i].called_at).getTime() - new Date(served[i - 1].served_at).getTime()) / 1000 / 60;
      if (gap >= 15) {
        backlog.push({
          id: `backlog-gap-${i}`,
          type: "idle_time",
          gap: Math.round(gap),
          before: served[i - 1].ticketNumber,
          after: served[i].ticketNumber,
          timestamp: served[i].called_at,
          analyzed: false,
        });
      }
    }

    setItems(backlog);
  }, []);

  if (items.length === 0) return null;

  const pending = items.filter((b) => !b.analyzed).length;

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-[#1E3A8A] flex items-center gap-2">
          🔍 Pending Audits
          {pending > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">{pending}</span>
          )}
        </h3>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-lg">
            {item.type === "excessive_handling" ? (
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-gray-900 mb-1">⚠️ Excessive Handling Time</p>
                  <p className="text-sm text-gray-700 mb-1">
                    <strong>{item.ticket}</strong> ({item.customer}) took{" "}
                    <strong>{item.actual} min</strong>
                    <span className="text-red-600"> (+{item.variance} min over target)</span>
                  </p>
                  <p className="text-xs text-gray-600">
                    Target: {item.target} min • Actual: {item.actual} min
                  </p>
                </div>
                <button
                  onClick={() =>
                    onAnalyze(
                      `${item.ticket} took ${item.actual} minutes (${item.variance} min over target)`
                    )
                  }
                  className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm font-bold hover:bg-blue-700 whitespace-nowrap"
                >
                  🧐 Analyze
                </button>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-gray-900 mb-1">⏸️ Idle Time Detected</p>
                  <p className="text-sm text-gray-700 mb-1">
                    <strong>{item.gap} minute gap</strong> between {item.before} and {item.after}
                  </p>
                  <p className="text-xs text-gray-600">No customers served during this period</p>
                </div>
                <button
                  onClick={() =>
                    onAnalyze(
                      `${item.gap} minute idle time between ${item.before} and ${item.after}`
                    )
                  }
                  className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm font-bold hover:bg-blue-700 whitespace-nowrap"
                >
                  🧐 Analyze
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {pending === 0 && (
        <div className="text-center py-4">
          <p className="text-green-600 font-semibold">✓ All issues analyzed!</p>
        </div>
      )}
    </div>
  );
};

export default PendingAudits;
