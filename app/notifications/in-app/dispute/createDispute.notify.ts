import { Notification } from "../../../../layers/notification/types";

export class CreateDisputeNotification extends Notification {
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
      title: "Escrow dispute Opened",
      message:
        "We’ve received your dispute regarding the recent escrow. Our team is reviewing the details and will be in touch with updates soon.",
      metadata: this.metadata,
    };
  }
}
