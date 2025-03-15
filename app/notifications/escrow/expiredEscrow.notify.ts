import { MailMessage } from "~/layers/notification/MailMessage";
import { type Notifiable, Notification } from "~/layers/notification/types";
import type { TPushNotification } from "~/services/pushNotification/push";

export class ExpiredEscrowNotification extends Notification {
  constructor(
    public params: {
      escrowId: string;
      firstName: string;
      receiver: "customer" | "vendor";
    },
  ) {
    super();
  }

  toMail(notifiable: Notifiable): MailMessage {
    if (this.params.receiver === "vendor") {
      return new MailMessage()
        .greeting(this.params.firstName)
        .subject("Expired escrow transactions")
        .line(
          ["Transaction timed-out. Customer didn't pay on time"].join("\n"),
        );
    }

    return new MailMessage()
      .greeting(this.params.firstName)
      .subject("Funds Successfully Released")
      .line(
        [
          "Transaction timed-out. You failed to complete the payment on time",
        ].join("\n"),
      );
  }

  toPush(): TPushNotification {
    return {
      title: "Expired escrow transactions",
      body:
        this.params.receiver === "vendor"
          ? `Transaction timed-out. Customer didn't pay on time`
          : "Transaction timed-out. You failed to complete the payment on time",
    };
  }
}
