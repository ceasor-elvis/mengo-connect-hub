import { api } from "@/lib/api";

/** Send a notification to a specific user */
export async function notifyUser(userId: string, title: string, message: string, type: string = "info") {
  try {
    await api.post("/notifications/", { user_id: userId, title, message, type });
  } catch (error) {
    console.error("Failed to map notification to user", error);
  }
}

/** Send a notification to all users with specific roles */
export async function notifyRole(roleNames: string | string[], title: string, message: string, type: string = "info") {
  try {
    const roles = Array.isArray(roleNames) ? roleNames : [roleNames];
    for (const roleName of roles) {
      await api.post("/notifications/", { user_id: `role:${roleName}`, title, message, type });
    }
  } catch (error) {
    console.error("Failed to send role notifications", error);
  }
}

/** Send a notification to all councillors (broadcast to all users) */
export async function notifyAllCouncillors(title: string, message: string, type: string = "info") {
  try {
    // Note: uses the broadcast endpoint which sends to EVERYONE. 
    // Use notifyRole('councillors', ...) if you only want the council.
    await api.post("/notifications/all/", { title, message, type });
  } catch (error) {
    console.error("Failed to send global notification", error);
  }
}

