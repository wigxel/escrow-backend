import { render } from "@react-email/render";
import { Mailable } from "~/layers/mailing/mailables";
import { Content } from "~/layers/mailing/mailables/Content";
import { Envelope } from "~/layers/mailing/mailables/Envelope";
import type { User } from "~/migrations/tables/interfaces";
import { OrderPlaced } from "~/resources/view/mail/order-placed";

export class OrderPlacedMail extends Mailable {
  constructor(
    public product: Product,
    public user: User,
  ) {
    super();
  }

  envelope(): Envelope {
    return new Envelope({ subject: "Order Testing" });
  }

  content(): Content {
    const viewTemplate = OrderPlaced({
      productName: this.product.name,
      username: this.user.lastName,
      action: {
        link: `https://theyardbazzar.com/seller/orders/${this.product.id}`,
        text: "View Order",
      },
    });

    return new Content({
      html:  render(viewTemplate),
      text: render(viewTemplate, { plainText: true }),
    });
  }
}
