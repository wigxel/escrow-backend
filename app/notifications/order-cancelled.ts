import { MailMessage } from "~/layers/notification/MailMessage";
import { type Notifiable, Notification } from "~/layers/notification/types";
import type { User } from "~/migrations/tables/interfaces";

export class OrderCancelledNotification extends Notification {
  constructor(public user: Pick<User, "firstName">) {
    super();
  }

  toMail(notifiable: Notifiable): MailMessage {
    return new MailMessage()
      .greeting(this.user.firstName)
      .subject("Cancelled order")
      .line("One or more of your orders has been cancelled");
  }
}
