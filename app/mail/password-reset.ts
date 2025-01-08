import { Mailable } from "~/layers/mailing/mailables";
import { Content } from "~/layers/mailing/mailables/Content";
import { Envelope } from "~/layers/mailing/mailables/Envelope";
import type { User } from "~/migrations/tables/interfaces";

export class PasswordResetMail extends Mailable {
  constructor(
    public user: Pick<User, "firstName">,
    public otp: string,
  ) {
    super();
  }

  envelope(): Envelope {
    return new Envelope({ subject: "Forgot Password" });
  }

  content(): Content {
    return new Content({
      // html: render(viewTemplate),
      text: `Hello ${this.user.firstName}\nHere's an OTP to reset your email ${this.otp}`,
    });
  }
}
