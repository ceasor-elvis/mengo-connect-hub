/**
 * WsStatusContext
 *
 * Opens a single WebSocket for the whole admin app and exposes:
 *   - wsStatus: 'connecting' | 'online' | 'offline'
 *   - useWsMessage: subscribe to incoming messages from any component
 *
 * Wrap <App> (or admin routes) with <WsStatusProvider />.
 */
import { createContext, useContext, useEffect, useRef, useState, ReactNode, useCallback } from "react";
import { connectSocket, isBackendMode, type WsMessage } from "@/data/api";

export type WsStatus = "connecting" | "online" | "offline";

interface WsCtx {
  status: WsStatus;
  /** Register a handler for WS messages; returns an unsubscribe fn */
  subscribe: (fn: (msg: WsMessage) => void) => () => void;
}

const WsStatusContext = createContext<WsCtx>({
  status: "offline",
  subscribe: () => () => {},
});

export function WsStatusProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<WsStatus>(isBackendMode ? "connecting" : "offline");
  const listenersRef = useRef<Set<(msg: WsMessage) => void>>(new Set());
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isBackendMode) return;

    const connect = () => {
      setStatus("connecting");
      wsRef.current = connectSocket(
        (msg) => {
          listenersRef.current.forEach((fn) => fn(msg));
        },
        () => {
          // Socket closed → schedule reconnect
          setStatus("offline");
          reconnectTimerRef.current = setTimeout(connect, 3000);
        }
      );

      if (wsRef.current) {
        wsRef.current.addEventListener("open", () => setStatus("online"));
        // If already OPEN by the time listener attaches, set online directly
        if (wsRef.current.readyState === WebSocket.OPEN) setStatus("online");
      }
    };

    connect();

    return () => {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      wsRef.current?.close();
    };
  }, []);

  const subscribe = useCallback((fn: (msg: WsMessage) => void) => {
    listenersRef.current.add(fn);
    return () => listenersRef.current.delete(fn);
  }, []);

  return (
    <WsStatusContext.Provider value={{ status, subscribe }}>
      {children}
    </WsStatusContext.Provider>
  );
}

export function useWsStatus() {
  return useContext(WsStatusContext);
}
