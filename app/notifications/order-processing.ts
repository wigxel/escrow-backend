import { MailMessage } from "~/layers/notification/MailMessage";
import { type Notifiable, Notification } from "~/layers/notification/types";
import type { User } from "~/migrations/tables/interfaces";

export class OrderProcessingNotification extends Notification {
  constructor(public user: Pick<User, "firstName">) {
    super();
  }

  toMail(notifiable: Notifiable): MailMessage {
    return new MailMessage()
      .greeting(this.user.firstName)
      .subject("Order in Progress!")
      .line(
        "Your order has been received and is currently being processed. We’re working hard to prepare it for you. You’ll receive an update once it’s on its way.",
      );
  }
}
