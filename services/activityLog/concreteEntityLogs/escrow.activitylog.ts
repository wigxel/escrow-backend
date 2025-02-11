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

  statusFactory(status: string): (params: ParamsWithId) => {
    kind: string;
    entityId: string;
    data: {
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
