import { Effect, Layer, pipe } from "effect";
import { ConfigProvider } from "effect";
import { Mailer } from "../../../layers/mailing";
import type { SendMailParams } from "../../../layers/mailing/types";
import { EmailChannel } from "../../../layers/notification/EmailChannel";
import { MailMessage } from "../../../layers/notification/MailMessage";
import { SMSChannel } from "../../../layers/notification/SMSChannel";
import { NotificationManager, make } from "../../../layers/notification/layer";
import {
  type Notifiable,
  Notification,
} from "../../../layers/notification/types";

class NotificationTest extends make<NotificationTest>() {}

describe("NotificationService", () => {
  it("can send multiple notification", async () => {
    const instance = new NotificationManager();
    const channel_one = new SMSChannel();
    const channel_two = new EmailChannel();
    const mailService = {
      send: (params: SendMailParams) => Effect.succeed(undefined),
    };

    instance.registerChannel(channel_one);
    instance.registerChannel(channel_two);
    const channel_one_spy = vi.spyOn(channel_one, "send");
    const channel_two_spy = vi.spyOn(channel_two, "send");
    const event = new OrderFulfilled({ name: "Johnny" });

    const NotificationLayer = Layer.succeed(NotificationTest, instance);
    const MailServiceTest = Layer.succeed(Mailer, mailService);

    const doSend = Effect.gen(function* (_) {
      const notification = yield* NotificationTest;
      yield* notification
        .route("mail", { address: "johnny@gmail.com" })
        .route("sms", { phoneNumber: "+32049939288" })
        .notify(event);
    });

    const mail_service_spy = vi.spyOn(mailService, "send");

    // act
    await pipe(
      doSend,
      Effect.provide(NotificationLayer),
      Effect.provide(MailServiceTest),
      Effect.provide(
        Layer.setConfigProvider(
          ConfigProvider.fromJson({
            APP_NAME: "TestApp",
            MAIL_FROM: "app@domain.com",
          }),
        ),
      ),
      Effect.runPromise,
    );

    // assert
    expect(channel_one_spy).toBeCalledWith(
      expect.objectContaining({
        entity: event,
      }),
    );
    expect(channel_two_spy).toBeCalledWith(
      expect.objectContaining({
        entity: event,
      }),
    );
    expect(mail_service_spy).toBeCalledWith(
      expect.objectContaining({
        text: expect.stringContaining("We really love to hear"),
      }),
    );
  });
  it.todo("can send a single notification to multiple users", async () => {});
});

class OrderFulfilled extends Notification {
  constructor(public data: { name: string }) {
    super();
  }

  toMail(notifiable: Notifiable): MailMessage {
    return new MailMessage()
      .from("test@service.com", "The Test Service")
      .subject("Subject")
      .greeting("Hi James")
      .line("We really love to hear from you soon")
      .line("Thank you for giving us a nice time")
      .line("Thank you for your patronage")
      .footer("Go for a dance", {
        text: "Wait a minute",
        url: "https://somerandomlinke.com",
      });
  }
}

// should the transformer be lazy or eager.
// I think eager is better than.
//
// const message = new Message();

// message
//   .subject("Hi")
//   .line("Hi")
//   .line("Hi")
//   .footer("Go for a dance", {
//     text: "Wait a minute",
//     url: "https://somerandomlinke.com",
//   });

// const transformer = new ReactTransformer()
// transformer.transform(message);
//
