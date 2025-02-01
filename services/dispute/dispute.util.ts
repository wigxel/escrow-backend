import { safeArray } from "@repo/shared/src/data.helpers";
const disputeStatusTransitions = {
  pending: ["open"],
  open: ["resolved"],
  resolved: [],
  cancelled: [],
} as const;

/**
 * this functions makes sure transitioning from one status to the next
 * is legal
 * @param currentStatus - the dispute current status
 * @param status - the new status to transition to
 */
export const canTransitionDisputeStatus = (
  currentStatus: string,
  status: string,
) => {
  // Check if the transition is valid
  const match = safeArray(disputeStatusTransitions[currentStatus]);
  if (match.length === 0) return false;
  // Check if the transition is valid
  return match.includes(status);
};
