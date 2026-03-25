import { supabase } from "@/integrations/supabase/client";

/** Send a notification to a specific user */
export async function notifyUser(userId: string, title: string, message: string, type: string = "info") {
  await supabase.from("notifications").insert({ user_id: userId, title, message, type } as any);
}

/** Send a notification to all councillors */
export async function notifyAllCouncillors(title: string, message: string, type: string = "info") {
  const { data: roles } = await supabase.from("user_roles").select("user_id");
  if (!roles) return;
  const uniqueIds = [...new Set(roles.map((r) => r.user_id))];
  const inserts = uniqueIds.map((uid) => ({ user_id: uid, title, message, type }));
  if (inserts.length > 0) {
    await supabase.from("notifications").insert(inserts as any);
  }
}
