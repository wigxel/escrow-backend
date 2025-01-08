import { Mailable } from "~/layers/mailing/mailables";
import { Content } from "~/layers/mailing/mailables/Content";
import { Envelope } from "~/layers/mailing/mailables/Envelope";

export class CheckoutSuccessfulMail extends Mailable {
  envelope(): Envelope {
    return new Envelope({ subject: "Successful checkout" });
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
      text: "Congratulation! your checkout process was successful",
    });
  }
}
