import type { ParamsWithId } from "./escrow.activitylog";

export const disputeActivityLog = {
  created(params) {
    return {
      kind: "Dispute",
      entityId: params?.id,
      data: {
        status: "created",
        summary: "Dispute created",
        params,
      },
    };
  },
  opened(params) {
    return {
      kind: "Dispute",
      entityId: params?.id,
      data: {
        status: "opened",
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
        status: "resolved",
        summary: "Dispute has been resolved",
        params,
      },
    };
  },
};
