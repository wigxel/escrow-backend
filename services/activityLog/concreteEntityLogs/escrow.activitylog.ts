export const escrowActivityLog = {
  created(params: ParamsWithId) {
    return {
      kind: "Escrow",
      entityId: params?.id,
      data: {
        status: "created",
        summary: "Escrow transaction created",
        params,
      },
    };
  },
  depositPending(params: { id: string }) {
    return {
      kind: "Escrow",
      entityId: params.id,
      data: {
        status: "deposit.pending",
        summary: "Payer viewed the transaction",
        params,
      },
    };
  },
  depositSuccess(params) {
    return {
      kind: "Escrow",
      entityId: params?.id,
      data: {
        status: "deposit.success",
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
        status: "service.pending",
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
        status: "deposit.confirmed",
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
        status: "completed",
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
        status: "dispute",
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
        status: "refunded",
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
        status: "cancelled",
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
        status: "expired",
        summary: "Transaction timed-out. Customer didn't pay in time",
        params,
      },
    };
  },

  statusFactory(status: string): (params: ParamsWithId) => {
    kind: string;
    entityId: string;
    data: {
      status: string;
      summary: string;
      params: ParamsWithId;
    };
  } {
    if (!status) {
      console.warn("Invalid status provided");
      return undefined;
    }

    let concreteStatus = status;

    // Capitalize second part after splitting by dot if it exists
    if (status.includes(".")) {
      let [firstPart, secondPart] = status.split(".");
      secondPart = secondPart.charAt(0).toUpperCase() + secondPart.slice(1);
      concreteStatus = firstPart + secondPart;
    }

    if (typeof this[concreteStatus] === "function") {
      return this[concreteStatus];
    }
    console.warn(`No matching function for status: ${concreteStatus}`);
    return undefined;
  },
};

export type ParamsWithId = {
  id: string;
  [key: string]: string;
};
