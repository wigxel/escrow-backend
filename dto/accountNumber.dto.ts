import { z } from "zod";

export const resolveAccountNumberRules = z.object({
  accountNumber:z.string(),
  bankCode:z.string(),
})
