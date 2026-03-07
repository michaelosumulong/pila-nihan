import { useState, useEffect, useCallback } from "react";

export const useLowBattery = () => {
  const [lowBatteryMode, setLowBatteryMode] = useState(() => {
    return localStorage.getItem("pila-low-battery") === "true";
  });
  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => {
    if (lowBatteryMode) {
      document.body.classList.add("low-battery-mode");
    } else {
      document.body.classList.remove("low-battery-mode");
    }
    return () => document.body.classList.remove("low-battery-mode");
  }, [lowBatteryMode]);

  const toggleLowBattery = useCallback(() => {
    const newMode = !lowBatteryMode;
    setLowBatteryMode(newMode);
    localStorage.setItem("pila-low-battery", String(newMode));
    return newMode;
  }, [lowBatteryMode]);

  const manualRefresh = useCallback(() => {
    setLastRefresh(new Date());
  }, []);

  return { lowBatteryMode, lastRefresh, toggleLowBattery, manualRefresh };
};
