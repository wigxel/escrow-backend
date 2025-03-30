import { MailMessage } from "~/layers/notification/MailMessage";
import { type Notifiable, Notification } from "~/layers/notification/types";

export class ReleaseCodeNotification extends Notification {
  constructor(
    public user: { firstName: string },
    public releaseCode: string,
  ) {
    super();
  }

  toMail(notifiable: Notifiable): MailMessage {
    return new MailMessage()
      .greeting(this.user.firstName)
      .subject("Release Code for Escrow Completion")
      .line(
        [
          "We are pleased to inform you that the release code for your escrow transaction has been successfully generated.",
          "Please use the following code to confirm the release of funds: ",
          this.releaseCode,
        ].join("\n"),
      );
  }

  toDatabase() {
    return {
      tag: "escrow",
      title: "Release Code for Escrow Completion",
      message: `We are pleased to inform you that the release code for your escrow transaction has been successfully generated. 
      Please check your email for the generated code`,
      metadata: {},
    };
  }
}
