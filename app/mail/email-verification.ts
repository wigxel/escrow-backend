import { render } from "@react-email/render";
import { Mailable } from "~/layers/mailing/mailables";
import { Content } from "~/layers/mailing/mailables/Content";
import { Envelope } from "~/layers/mailing/mailables/Envelope";
import type { User } from "~/migrations/tables/interfaces";
import { EmailVerifcationView } from "~/resources/view/mail/auth/email-verification";

export class EmailVerificationMail extends Mailable {
  constructor(
    public user: Pick<User, "firstName">,
    public otp: string,
  ) {
    super();
  }

  envelope(): Envelope {
    return new Envelope({ subject: "Email verification" });
  }

  content(): Content {
    const viewTemplate = EmailVerifcationView({
      username: this.user.firstName,
      otp:this.otp,
    });

    return new Content({
      html: render(viewTemplate),
      text: `Welcome ${this.user.firstName}\nHere's an OTP to verify your email ${this.otp}`,
    });
  }
}
