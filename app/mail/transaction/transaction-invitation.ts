import { render } from "@react-email/render";
import { Mailable } from "~/layers/mailing/mailables";
import { Content } from "~/layers/mailing/mailables/Content";
import { Envelope } from "~/layers/mailing/mailables/Envelope";
import type { User } from "~/migrations/tables/interfaces";
import { TransactionInvitation } from "~/resources/view/mail/transaction/transaction-invitation";

export class TransactionInvitationMail extends Mailable {
  public constructor(public user: Pick<User, "lastName">) {
    super();
  }

  envelope(): Envelope {
    return new Envelope({
      subject: " Invitation to Proceed with Escrow Agreement",
    });
  }

  content(): Content {
    const viewTemplate = TransactionInvitation({
      username: this.user.lastName,
      action: {
        link: `localhost:3000/transactions/${1}/invite`,
        text: "Accept",
      },
    });

    return new Content({
      html: render(viewTemplate),
      text: "Congratulation! your checkout process was successful",
    });
  }
}
