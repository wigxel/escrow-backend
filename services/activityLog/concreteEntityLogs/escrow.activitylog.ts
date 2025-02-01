import type { TActivityLogEvent } from "~/types/types";

export const escrowActivityLog = {
  created(params: ParamsWithId) {
    return {
      kind: "Escrow",
      entityId: params?.id,
      data: {
        summary: "Escrow transaction created",
        params,
      },
    };
  },
  depositPending(params) {
    return {
      kind: "Escrow",
      entityId: params?.id,
      data: {
        summary: "Escrow deposit is pending",
        params,
      },
    };
  },
  depositSuccess(params) {
    return {
      kind: "Escrow",
      entityId: params?.id,
      data: {
        summary: "Escrow deposit successful",
        params,
      },
    };
  },
  servicePending(params) {
    return {
      kind: "Escrow",
      entityId: params?.id,
      data: {
        summary: "Escrow service is pending",
        params,
      },
    };
  },
  serviceConfirmed(params) {
    return {
      kind: "Escrow",
      entityId: params?.id,
      data: {
        summary: "Escrow service confirmed",
        params,
      },
    };
  },
  completed(params) {
    return {
      kind: "Escrow",
      entityId: params?.id,
      data: {
        summary: "Escrow transaction completed. Funds released",
        params,
      },
    };
  },
  dispute(params) {
    return {
      kind: "Escrow",
      entityId: params?.id,
      data: {
        summary: "Escrow dispute initiated",
        params,
      },
    };
  },
  refunded(params) {
    return {
      kind: "Escrow",
      entityId: params?.id,
      data: {
        summary: "Escrow funds refunded",
        params,
      },
    };
  },
  cancelled(params) {
    return {
      kind: "Escrow",
      entityId: params?.id,
      data: {
        summary: "Escrow transaction cancelled",
        params,
      },
    };
  },
  expired(params) {
    return {
      kind: "Escrow",
      entityId: params?.id,
      data: {
        summary: "Escrow transaction expired",
        params,
      },
    };
  },
};

export type ParamsWithId = {
  id: string;
  [key: string]: string;
};
