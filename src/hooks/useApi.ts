/**
 * React hooks for the unified data layer.
 * Provides reactive state that works in both mock and backend modes.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { subscribe, isBackendMode, connectSocket, type WsMessage } from "@/data/api";
import { appStore } from "@/data/appStore";
import { useAppStore } from "@/hooks/useAppStore";
import { useWsStatus } from "@/contexts/WsStatusContext";

/**
 * Alias for useAppStore — keeps imports consistent across pages.
 */
export const useStoreSync = useAppStore;

/**
 * WebSocket hook for real-time updates from the backend.
 * Subscribes to the shared WsStatusContext — no new connection is opened.
 */
export function useElectionSocket(onMessage?: (msg: WsMessage) => void) {
  const { subscribe } = useWsStatus();
  const callbackRef = useRef(onMessage);
  callbackRef.current = onMessage;

  useEffect(() => {
    if (!onMessage) return;
    return subscribe((msg) => callbackRef.current?.(msg));
  }, [subscribe]);
}

/**
 * Countdown hook for election end time
 */
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

/**
 * Category voting timer countdown.
 * Resets whenever `resetKey` changes (e.g. when voter advances to next category).
 * @param durationSeconds - total countdown seconds
 * @param resetKey - any value; when it changes the timer resets (pass currentStep)
 */
export function useCategoryCountdown(durationSeconds: number, resetKey?: number | string) {
  const [remaining, setRemaining] = useState(durationSeconds);
  const remainingRef = useRef(durationSeconds);

  // Reset whenever the step or duration changes
  useEffect(() => {
    remainingRef.current = durationSeconds;
    setRemaining(durationSeconds);
  }, [durationSeconds, resetKey]);

  // Single persistent interval
  useEffect(() => {
    const id = setInterval(() => {
      if (remainingRef.current <= 0) return;
      remainingRef.current -= 1;
      setRemaining(remainingRef.current);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const m = Math.floor(remaining / 60);
  const s = remaining % 60;
  const urgent = remaining <= 30 && remaining > 0;
  const expired = remaining <= 0;
  return {
    display: `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`,
    remaining,
    urgent,
    expired,
  };
}
