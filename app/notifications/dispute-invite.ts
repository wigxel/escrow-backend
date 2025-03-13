import { MailMessage } from "../../layers/notification/MailMessage";
import { type Notifiable, Notification } from "../../layers/notification/types";
import type { User } from "../../migrations/tables/interfaces";

export class DisputeInviteNotification extends Notification {
  constructor(public user: Pick<User, "firstName">) {
    super();
  }

  toMail(notifiable: Notifiable): MailMessage {
    return new MailMessage()
      .greeting(this.user.firstName)
      .subject("Invitation to Participate in Open Escrowo Dispute")
      .line(
        [
          "We would like to inform you that you have been invited to",
          "participate in an open dispute related to an escrow.",
          "involvement is important for resolving this matter.",
        ].join("\n"),
      );
  }
}
