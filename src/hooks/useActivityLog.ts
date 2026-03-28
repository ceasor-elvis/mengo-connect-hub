import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useCallback } from "react";

export function useActivityLog() {
  const { user } = useAuth();

  const log = useCallback(
    async (action: string, module: string, details?: string) => {
      if (!user) return;
      try {
        await api.post("/activity-logs/", {
          action,
          module,
          details,
        });
      } catch (error) {
        console.error("Failed to log activity:", error);
      }
    },
    [user]
  );

  return { log };
}
