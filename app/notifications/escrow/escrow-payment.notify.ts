import { MailMessage } from "~/layers/notification/MailMessage";
import { type Notifiable, Notification } from "~/layers/notification/types";

export class EscrowPaymentNotification extends Notification {
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
        .subject("Escrow Payment Successful")
        .line(
          [
            "Great news! The payment for your item has been successfully processed and secured in escrow.",
            " You can now proceed with the next steps.",
          ].join("\n"),
        );
    }

    return new MailMessage()
      .greeting(this.user.firstName)
      .subject("Escrow Payment Successful")
      .line(
        [
          "Your payment is now successfully held in escrow, ",
          "ensuring a safe and secure transaction. The seller has received the confirmation",
        ].join("\n"),
      );
  }

  toDatabase() {
    if (this.client === "vendor") {
      return {
        tag: "escrow",
        title: "Escrow Payment Successful",
        message:
          "Good news! Your payment has been successfully deposited in escrow. The buyer’s funds are now secured, and you can continue with the transaction.",
        metadata: this.metadata,
      };
    }

    return {
      tag: "escrow",
      title: "Escrow Payment Successful",
      message:
        "Your payment is now successfully held in escrow, ensuring a safe and secure transaction. The seller has received the confirmation",
      metadata: this.metadata,
    };
  }
}
