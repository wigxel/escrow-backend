import { z } from "zod";

export const newDisputeSchema = z.object({
  orderId: z.string().uuid(),
  reason: z.string(),
  message: z.string(),
});

export const sendDisputeMessageSchema = z.object({
  disputeId: z.string().uuid(),
  message: z.string().min(1, "Message cannot be empty"),
});

export const disputeStatusUpdateSchema = z.object({
  status: z.enum(["open", "resolved"]),
  disputeId: z.string().uuid(),
});

export const disputeIdSchema = z.object({
  disputeId: z.string().uuid(),
});

export const disputeInviteSchema = z.object({
  disputeId: z.string().uuid(),
  userId: z.string().uuid(),
});
