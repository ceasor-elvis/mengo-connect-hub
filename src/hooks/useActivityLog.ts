import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCallback } from "react";

export function useActivityLog() {
  const { user } = useAuth();

  const log = useCallback(
    async (action: string, module: string, details?: string) => {
      if (!user) return;
      await supabase.from("activity_logs").insert({
        user_id: user.id,
        action,
        module,
        details,
      } as any);
    },
    [user]
  );

  return { log };
}
