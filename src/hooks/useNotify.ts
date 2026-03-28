import { api } from "@/lib/api";

/** Send a notification to a specific user */
export async function notifyUser(userId: string, title: string, message: string, type: string = "info") {
  try {
    await api.post("/notifications/", { user_id: userId, title, message, type });
  } catch (error) {
    console.error("Failed to map notification to user", error);
  }
}

/** Send a notification to all councillors */
export async function notifyAllCouncillors(title: string, message: string, type: string = "info") {
  try {
    // Assuming backend provides an endpoint to notify all councillors
    await api.post("/notifications/all/", { title, message, type });
  } catch (error) {
    console.error("Failed to send global notification", error);
  }
}
