import { useState, useEffect } from "react";
import { toast } from "sonner";

export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success("Connection restored!", {
        description: "Queue data will sync automatically",
        duration: 3000,
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.warning("Naka-offline mode tayo", {
        description: "Don't worry! Your changes are saved locally and will sync when connection returns",
        duration: Infinity,
      });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
};
