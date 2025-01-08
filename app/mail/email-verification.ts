import { render } from "@react-email/render";
import { Mailable } from "~/layers/mailing/mailables";
import { Content } from "~/layers/mailing/mailables/Content";
import { Envelope } from "~/layers/mailing/mailables/Envelope";
import type { User } from "~/migrations/tables/interfaces";

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
    // const viewTemplate = OrderPlaced({
    //   username: this.user.lastName,
    //   action: {
    //     link: `https://theyardbazzar.com/seller/orders/${this.product.id}`,
    //     text: "View Order",
    //   },
    // });

    return new Content({
      // html: render(viewTemplate),
      text: `Welcome ${this.user.firstName}\nHere's an OTP to verify your email ${this.otp}`,
    });
  }
}
