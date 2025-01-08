import { MailMessage } from "~/layers/notification/MailMessage";
import { type Notifiable, Notification } from "~/layers/notification/types";
import type { User } from "~/migrations/tables/interfaces";

export class DisputeLeaveNotification extends Notification {
  constructor(
    public disputeId: string,
    public user: Pick<User, "firstName">,
  ) {
    super();
  }

  toMail(notifiable: Notifiable): MailMessage {
    return new MailMessage()
      .greeting(this.user.firstName)
      .subject("Removal from Open Dispute")
      .line(`You have been removed from dispute ${this.disputeId}`);
  }
}
