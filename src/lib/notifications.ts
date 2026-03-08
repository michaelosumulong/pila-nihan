export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: "success" | "info" | "warning" | "alert";
  ticketNumber?: string;
}

const STORAGE_KEY = "pila-notifications";
const MAX_NOTIFICATIONS = 50;

export const getNotifications = (): AppNotification[] => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
};

export const addNotification = (
  notification: Omit<AppNotification, "id" | "timestamp" | "read">
): AppNotification => {
  const notifications = getNotifications();
  const newNotif: AppNotification = {
    ...notification,
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
    read: false,
  };
  notifications.unshift(newNotif);
  if (notifications.length > MAX_NOTIFICATIONS) notifications.splice(MAX_NOTIFICATIONS);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  window.dispatchEvent(new CustomEvent("pila-notification-change"));
  return newNotif;
};

export const markAsRead = (id: string) => {
  const notifications = getNotifications().map((n) =>
    n.id === id ? { ...n, read: true } : n
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  window.dispatchEvent(new CustomEvent("pila-notification-change"));
};

export const markAllAsRead = () => {
  const notifications = getNotifications().map((n) => ({ ...n, read: true }));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  window.dispatchEvent(new CustomEvent("pila-notification-change"));
};

export const getUnreadCount = (): number =>
  getNotifications().filter((n) => !n.read).length;
