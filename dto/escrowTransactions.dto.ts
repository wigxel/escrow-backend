import { z } from "zod";
import {
  amountValidator,
  emailValidator,
  phoneValidator,
  usernameValidator
} from "./user.dto";

export const USER_ROLE = ["seller"] as const;

export const createEscrowTransactionRules = z.object({
  amount: amountValidator,
  title: z.string({ required_error: "Title field is required" })
    .min(3)
    .optional(),
  description: z.string({
    required_error: "Description field is required"
  }).optional(),
  creatorRole: z.enum(USER_ROLE, { required_error: "Please provide a role" }),
  customerPhone: phoneValidator,
  customerUsername: usernameValidator.default("NONE"),
  customerEmail: emailValidator,
  terms: z.boolean({ required_error: "Please accept the terms" }).default(false)
});

export const confirmEscrowRequestRules = z.object({
  customerUsername: usernameValidator,
  customerPhone: phoneValidator,
  customerEmail: emailValidator
});

export const escrowStatusRules = z.object({
  status: z.enum(["service.pending", "service.confirmed"]),
});
