import { z } from "zod";

export const resolveAccountNumberRules = z.object({
  accountNumber:z.string({required_error:"Account number is required"}),
  bankCode:z.string({required_error:"Bank code is required"}),
})
