import type { ParamsWithId } from "./escrow.activitylog";

export const disputeActivityLog = {
  opened(params) {
    return {
      kind: "Dispute",
      entityId: params?.id,
      data: {
        summary: "Dispute opened",
        params,
      },
    };
  },
  
  resolved(params: ParamsWithId) {
    return {
      kind: "Dispute",
      entityId: params?.id,
      data: {
        summary: "Dispute has been resolved",
        params,
      },
    };
  },
};
