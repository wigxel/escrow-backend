import { z } from "zod";

export const USER_ROLE = ["seller", "buyer"] as const

export const createTransactionRules = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  creator_role: z.enum(USER_ROLE),
});
