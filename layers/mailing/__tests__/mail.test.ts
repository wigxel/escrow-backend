import { ConfigProvider, Effect, Layer, pipe } from "effect";
import { Mailer } from "~/layers/mailing";
import { Mail, MailLive } from "~/layers/mailing/mail";
import { Mailable } from "~/layers/mailing/mailables";
import { Content } from "~/layers/mailing/mailables/Content";
import { Envelope } from "~/layers/mailing/mailables/Envelope";
import { SendMailParams } from "~/layers/mailing/types";

class OrderFulfilledMail extends Mailable {
  constructor(public data: { name: string }) {
    super();
  }

  envelope() {
    return new Envelope({
      from: "johnny@gmail.com",
      subject: "Order Fulfilled",
    });
  }

  content() {
    return new Content({
      html: `<h1>Hello ${this.data.name}</h1>`,
      text: `Hello ${this.data.name}`,
    });
  }
}

it("can quickly send out mail", async () => {
  const mailer = {
    send: function (params: SendMailParams) {
      return Effect.succeed(undefined);
    },
  };

  const mail_template = new OrderFulfilledMail({
    name: "Johnny",
  });

  const doSend = Effect.gen(function* (_) {
    const mail = yield* Mail;
    yield* mail
      .to(["some.user@test.com", "John Koplan"])
      .cc(["user.friend@domain.com", "Kelvins Franco"])
      .send(mail_template);
  });

  const mail_service_spy = vi.spyOn(mailer, "send");

  // act
  await pipe(
    doSend,
    Effect.provide(MailLive),
    Effect.provide(Layer.succeed(Mailer, mailer)),
    Effect.provide(
      Layer.setConfigProvider(
        ConfigProvider.fromJson({
          APP_NAME: "TheYardBazaar",
          MAIL_FROM: "app@domain.com",
        }),
      ),
    ),
    Effect.runPromise,
  );

  // assertion
  expect(mail_service_spy.mock.lastCall).toMatchInlineSnapshot(`
    [
      {
        "bcc": [],
        "cc": [
          Address {
            "address": "user.friend@domain.com",
            "name": "Kelvins Franco",
          },
        ],
        "from": Address {
          "address": "app@domain.com",
          "name": "TheYardBazaar",
        },
        "html": "<h1>Hello Johnny</h1>",
        "replyTo": [],
        "subject": "Order Fulfilled",
        "text": "Hello Johnny",
        "to": [
          Address {
            "address": "some.user@test.com",
            "name": "John Koplan",
          },
        ],
      },
    ]
  `);
});
