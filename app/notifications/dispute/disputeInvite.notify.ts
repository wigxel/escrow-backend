import { Notification } from "~/layers/notification/types";

export class DisputeInviteNotify extends Notification {
  constructor(
    public metadata?: {
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
      title: "Invitation to Participate in Open Escrow Dispute",
      message: `We would like to inform you that you have been invited to
        participate in an open dispute related to an escrow. Your
        involvement is important for resolving this matter.`,
      metadata: this.metadata,
    };
  }
}
