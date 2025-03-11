import { z } from "zod";

export const newDisputeSchema = z.object({
  escrowId: z.string({required_error:"Escrow transaction id is required"}).uuid(),
  reason: z.string({required_error:"Please provide the reason for the dispute"}),
  categoryId: z.number({ coerce: true }).min(1),
  resolutionId: z.number({ coerce: true }).min(1),
  file: z
    .instanceof(File)
    .refine(
      (file) => ["image/jpeg", "image/png", "image/jpg"].includes(file.type),
      {
        message: "Only JPEG and PNG files are allowed",
      },
    ),
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
