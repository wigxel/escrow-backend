import { z } from "zod";

export const withdrawalRules = z.object({
  accountNumberId:z.string().uuid(),
  amount:z.number({coerce:true}),
})
