import { safeArray } from "@repo/shared/src/data.helpers";
import { Effect } from "effect";
import type { z } from "zod";
import { ExpectedError } from "~/config/exceptions";
import type { TEscrowParticipant } from "~/migrations/schema";
import type { escrowStatusRules } from "~/validationRules/escrowTransactions.rules";

const escrowStatusTransitions = {
  created: ["deposit.pending", "cancelled"],
  "deposit.pending": ["deposit.success", "cancelled"],
  "deposit.success": ["service.pending", "service.confirmed"],
  cancelled: [],
} as const;

/**
 * this functions makes sure transitioning from one status to the next
 * is legal
 * @param currentStatus - the escrow current status
 * @param status - the new status to transition to
 */
export const canTransitionEscrowStatus = (
  currentStatus: string,
  status: z.infer<typeof escrowStatusRules>["status"],
) => {
  // Check if the transition is valid
  const match = safeArray(escrowStatusTransitions[currentStatus]);
  if (match.length === 0) return false;
  // Check if the transition is valid
  return match.includes(status);
};

export const getBuyerAndSellerFromParticipants = (
  participants: TEscrowParticipant[],
) => {
  return Effect.gen(function* (_) {
    const seller = participants.find((p) => p.role === "seller");
    const buyer = participants.find((p) => p.role === "buyer");

    if (!seller || !buyer) {
      yield* new ExpectedError(
        "Invalid participants. Seller or buyer not found.",
      );
    }
    return { seller, buyer };
  });
};
