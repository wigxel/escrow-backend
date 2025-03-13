import type { Notification } from "../../migrations/schema";

export const unserializeNotification = (notifications: Notification[]) => {
  if (!notifications.length) return [];
  const result: Notification[] = [];
  for (const notification of notifications) {
    result.push({ ...notification, meta: JSON.parse(notification.meta) });
  }

  return result;
};
