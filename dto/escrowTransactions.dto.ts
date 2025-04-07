import { z } from "zod";
import {
  amountValidator,
  emailValidator,
  phoneValidator,
  usernameValidator,
  uuidValidator,
} from "./user.dto";

export const USER_ROLE = ["seller"] as const;

export const createEscrowTransactionRules = z.object({
  amount: amountValidator,
  title: z.string({ required_error: "Title field is required" }).min(3),
  description: z.string({
    required_error: "Description field is required",
  }),
  creatorRole: z.enum(USER_ROLE, { required_error: "Please provide a role" }),
  customerPhone: phoneValidator,
  customerUsername: usernameValidator.default("NONE"),
  customerEmail: emailValidator,
  terms: z
    .boolean({ required_error: "Please accept the terms" })
    .default(false),
});

export const confirmEscrowRequestRules = z.object({
  customerUsername: usernameValidator,
  customerPhone: phoneValidator,
  customerEmail: emailValidator,
});

export const escrowStatusRules = z.object({
  status: z.enum(["service.pending", "service.confirmed"]),
});

export const escrowTransactionFilterDto = z.object({
  status: z
    .enum([
      "created",
      "deposit.pending",
      "deposit.success",
      "service.pending",
      "service.confirmed",
      "completed",
      "dispute",
      "refunded",
      "cancelled",
      "expired",
    ])
    .optional(),
});

export type TEscrowTransactionFilter = z.infer<
  typeof escrowTransactionFilterDto
>;

export const paymentMetaSchema = z.object({
  amount: z.string({ required_error: "amount is missing" }),
  metadata: z.object({
    customerDetails: z.object({
      userId: uuidValidator("User ID"),
      email: emailValidator,
      username: usernameValidator,
      phone: phoneValidator,
      role: z.any(),
    }),
    escrowId: uuidValidator("Escrow ID"),
    relatedUserId: z.any(),
  }),
});
