import { z } from "zod";

export const withdrawalRules = z.object({
  accountNumberId: z
    .string({ required_error: "Account number id is required" })
    .uuid(),
  amount: z.number({ coerce: true, required_error: "Amount is required" }),
});
