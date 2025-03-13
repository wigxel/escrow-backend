import { render } from "@react-email/render";
import { Mailable } from "../../../layers/mailing/mailables";
import { Content } from "../../../layers/mailing/mailables/Content";
import { Envelope } from "../../../layers/mailing/mailables/Envelope";
import { EscrowUserAccountView } from "../../../resources/view/mail/auth/escrowuseraccount";

export class EscrowUserAccounntMail extends Mailable {
  public constructor(public username: string) {
    super();
  }

  envelope(): Envelope {
    return new Envelope({
      subject: "Account Created Successfully!",
    });
  }

  content(): Content {
    const viewTemplate = EscrowUserAccountView({
      username: this.username,
    });

    return new Content({
      html: render(viewTemplate),
      text: `Your account has been successfully created as part of the escrow
       process. To complete your setup, please set your password. 
       If you didn’t set a password earlier, you can use the 'Forgot Password' 
       option as the "sign-in" page to generate one and gain access to your account.`,
    });
  }
}
