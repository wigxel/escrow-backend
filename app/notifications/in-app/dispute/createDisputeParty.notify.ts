import { Notification } from "../../../../layers/notification/types";

export class CreateDisputePartyNotification extends Notification {
  constructor(
    public metadata: {
      escrowId: string;
      triggeredBy: string;
      role?: string;
    },
  ) {
    super();
  }

  toDatabase() {
    return {
      tag: "dispute",
      title: "Dispute Opened: Customer's Concern",
      message:
        "We want to inform you that the customer has raised a dispute regarding their recent escrow with you.",
      metadata: {
        escrowId: this.metadata.escrowId,
        triggeredby: {
          id: this.metadata.triggeredBy,
          role: this.metadata.role,
        },
      },
    };
  }
}
