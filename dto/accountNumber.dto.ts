import { z } from "zod";

export const resolveAccountNumberRules = z.object({
  accountNumber:z.string(),
  bankCode:z.string(),
  bankName:z.string().min(3)
})
