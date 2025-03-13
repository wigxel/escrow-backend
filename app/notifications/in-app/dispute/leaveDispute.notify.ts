import { Notification } from "../../../../layers/notification/types";

export class LeaveDisputeNotification extends Notification {
  constructor(
    public metadata?: {
      disputeId: string;
      triggeredBy: string;
      role?: string;
    },
  ) {
    super();
  }

  toDatabase() {
    return {
      tag: "dispute",
      title: "Removal from Open Dispute",
      message:
        "You have been removed from the open dispute you were previously involved in.",
      metadata: this.metadata,
    };
  }
}
