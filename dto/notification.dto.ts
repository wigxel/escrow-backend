import { z } from "zod";

export const getNotificationsSchema = z.object({
  type: z.enum(["all", "unread"]),
});

export const notificationIdSchema = z.object({
  ids: z.array(z.number({ coerce: true })),
});
