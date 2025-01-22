import { z } from "zod";

export const USER_ROLE = ["seller", "buyer"] as const

export const createEscrowTransactionRules = z.object({
  amount: z.number({ coerce: true }).min(1),
  title: z.string().min(3).optional(),
  description: z.string().optional(),
  terms:z.string().optional(),
  creatorRole: z.enum(USER_ROLE),
  customerUsername:z.string().min(3),
  customerPhone:z.number({coerce:true}),
  customerEmail:z.string().email()
});


export const confirmEscrowRequestRules = z.object({
  customerUsername:z.string().min(3),
  customerPhone:z.number({coerce:true}),
  customerEmail:z.string().email()
})
