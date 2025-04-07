import { z } from "zod";
import { uuidValidator } from "./user.dto";

export const newDisputeSchema = z.object({
  escrowId: uuidValidator("Escrow ID"),
  reason: z.string({
    required_error: "Please provide the reason for the dispute",
  }),
  categoryId: z.number({
    coerce: true,
    required_error: "Dispute category must be a number",
  }),
  resolutionId: z.number({
    coerce: true,
    required_error: "Dispute resolution must be a number",
  }),
  file: z
    .instanceof(File)
    .refine(
      (file) => ["image/jpeg", "image/png", "image/jpg"].includes(file.type),
      {
        message: "Only JPEG and PNG files are allowed",
      },
    )
    .refine(
      (file) => {
        return file.size <= 10 * 1024 * 1024;
      },
      {
        message: "File must be less than 10MB",
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
