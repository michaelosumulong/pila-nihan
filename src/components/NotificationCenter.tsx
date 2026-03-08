import { useState, useEffect } from "react";
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  type AppNotification,
} from "@/lib/notifications";

const typeIcon: Record<string, string> = {
  success: "✅",
  info: "ℹ️",
  warning: "⚠️",
  alert: "🔔",
};

const formatTime = (iso: string) =>
  new Date(iso).toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

interface Props {
  /** "light" for pages with light headers, "dark" for dark headers */
  variant?: "light" | "dark";
}

const NotificationCenter = ({ variant = "dark" }: Props) => {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState<AppNotification[]>([]);

  const refresh = () => {
    setUnread(getUnreadCount());
    if (open) setItems(getNotifications());
  };

  useEffect(() => {
    refresh();
    window.addEventListener("pila-notification-change", refresh);
    return () => window.removeEventListener("pila-notification-change", refresh);
  }, [open]);

  const bellColor = variant === "dark" ? "text-white" : "text-gray-600";

  return (
    <>
      {/* Bell Button */}
      <button
        onClick={() => { setOpen(true); setItems(getNotifications()); }}
        className={`relative ${bellColor} text-2xl`}
        aria-label="Notifications"
      >
        🔔
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 border-2 border-current">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-start justify-center pt-16 sm:pt-24"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[70vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[hsl(220,100%,13%)] to-[hsl(217,91%,60%)] px-5 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Notifications</h3>
                {unread > 0 && (
                  <button
                    onClick={() => { markAllAsRead(); refresh(); }}
                    className="text-xs text-white/80 hover:text-white"
                  >
                    Mark all as read
                  </button>
                )}
              </div>
              <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white text-2xl leading-none">
                ×
              </button>
            </div>

            {/* List */}
            <div className="overflow-y-auto max-h-[calc(70vh-72px)]">
              {items.length === 0 ? (
                <div className="text-center py-12 px-6">
                  <div className="text-5xl mb-3">🔔</div>
                  <p className="text-gray-600 font-semibold mb-1">No notifications yet</p>
                  <p className="text-sm text-gray-400">We'll alert you here when your turn is near</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {items.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => { if (!n.read) { markAsRead(n.id); refresh(); } }}
                      className={`p-4 cursor-pointer transition-colors ${
                        n.read ? "bg-gray-50 hover:bg-gray-100" : "bg-white hover:bg-blue-50 border-l-4 border-blue-500"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {!n.read && <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">{typeIcon[n.type] || "ℹ️"}</span>
                            <p className="font-bold text-gray-900 text-sm">{n.title}</p>
                          </div>
                          <p className="text-sm text-gray-700">{n.message}</p>
                          {n.ticketNumber && (
                            <span className="inline-block bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded font-mono font-bold mt-1">
                              {n.ticketNumber}
                            </span>
                          )}
                          <p className="text-xs text-gray-400 mt-1">{formatTime(n.timestamp)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NotificationCenter;
