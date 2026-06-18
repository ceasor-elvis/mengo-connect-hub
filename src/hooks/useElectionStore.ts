import { useState, useEffect, useCallback } from "react";
import { appStore, subscribe } from "@/data/appStore";

export function useElectionStore() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const unsub = subscribe(() => setTick((t) => t + 1));
    return () => { unsub(); };
  }, []);

  return appStore;
}

export function useCountdown(endTime: string) {
  const [remaining, setRemaining] = useState("");

  const calc = useCallback(() => {
    const diff = new Date(endTime).getTime() - Date.now();
    if (diff <= 0) return "00:00:00";
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }, [endTime]);

  useEffect(() => {
    setRemaining(calc());
    const id = setInterval(() => setRemaining(calc()), 1000);
    return () => clearInterval(id);
  }, [calc]);

  return remaining;
}

export function useCategoryCountdown(durationMinutes: number) {
  const [remaining, setRemaining] = useState(durationMinutes * 60);

  useEffect(() => {
    setRemaining(durationMinutes * 60);
  }, [durationMinutes]);

  useEffect(() => {
    if (remaining <= 0) return;
    const id = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(id);
  }, [remaining > 0]);

  const m = Math.floor(remaining / 60);
  const s = remaining % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
