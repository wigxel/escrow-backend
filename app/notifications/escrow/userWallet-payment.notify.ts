import { MailMessage } from "~/layers/notification/MailMessage";
import { type Notifiable, Notification } from "~/layers/notification/types";

export class UserWalletPaymentNotification extends Notification {
  constructor(
    public user: { firstName: string },
    public metadata: {
      escrowId: string;
      triggeredBy?: string;
      role?: string;
    },
    public client: "customer" | "vendor",
  ) {
    super();
  }

  toMail(notifiable: Notifiable): MailMessage {
    if (this.client === "vendor") {
      return new MailMessage()
        .greeting(this.user.firstName)
        .subject("Funds Released to Your Wallet")
        .line(
          [
            "Congratulations! The buyer has released the funds from escrow to your wallet.",
            " Your payment has been successfully processed and is now available.",
          ].join("\n"),
        );
    }

    return new MailMessage()
      .greeting(this.user.firstName)
      .subject("Funds Successfully Released")
      .line(
        [
          "Your payment has been successfully released from escrow to the user's wallet. ",
          "The transaction is now complete, and the user has received their funds.",
        ].join("\n"),
      );
  }

  toDatabase() {
    if (this.client === "vendor") {
      return {
        tag: "escrow",
        title: "Funds Successfully Released",
        message: `Your funds has been confirmed and released from escrow.  
        The payment has now been credited to your wallet`,
        metadata: this.metadata,
      };
    }

    return {
      tag: "escrow",
      title: "Funds Successfully Released to Seller",
      message: `Your payment has been successfully released from escrow to the user's wallet. 
       The transaction is now complete, and the user has received their funds.`,
      metadata: this.metadata,
    };
  }
}
