import { z } from "zod";

export const getNotificationsSchema = z.object({
  type: z.enum(["all", "unread"]),
  page:z.number({coerce:true}).min(1).optional(),
  limit:z.number({coerce:true}).min(1).optional()
});

export const notificationIdSchema = z.object({
  ids: z.array(z.number({ coerce: true })),
});
