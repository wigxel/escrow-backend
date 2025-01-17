import { z } from "zod";

export const USER_ROLE = ["seller", "buyer"] as const

export const createEscrowTransactionRules = z.object({
  amount: z.number({ coerce: true }).min(1),
  title: z.string().min(3).optional(),
  description: z.string().optional(),
  terms:z.string().optional(),
  creatorRole: z.enum(USER_ROLE),
  customerUsername:z.string().min(3).optional(),
  customerPhone:z.number({coerce:true}).optional(),
  customerEmail:z.string().email().optional()
});


export const InviteStatusRules = z.object({
  invitationId:z.string().uuid(),
  status:z.enum(["accepted", "declined"])
})
