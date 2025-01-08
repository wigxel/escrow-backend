import { ConfigProvider, Effect, Layer, pipe } from "effect";
import { Mailer } from "~/layers/mailing";
import { SESMailer } from "~/services/mailing/aws-ses";
import { MailjetLive } from "~/services/mailing/mailjet";
import { runTest } from "~/tests/mocks/app";

const sendTestMail = (fromAddress: string, toAddress: string) =>
  pipe(
    Effect.gen(function* (_) {
      const mailer = yield* Mailer;

      const status = mailer.send({
        to: { name: "Receiver", address: toAddress },
        from: { name: "Sender", address: fromAddress },
        subject: "A test email",
        text: "Some test content",
      });

      yield* status;
    }),
  );

it("should send email for Mailjet", async () => {
  await Effect.runPromise(
    pipe(
      sendTestMail("noreply@theyardbazaar.com", "joseph.owonwo@gmail.com"),
      Effect.match({
        // This is intentional.
        // I'm not passing in the
        // right credentials
        onSuccess: () => expect.fail(`Shouldn't be successful`),
        onFailure: () => expect(1).toBe(1),
      }),
      Effect.provide(MailjetLive),
      Effect.provide(
        Layer.setConfigProvider(
          ConfigProvider.fromJson({
            MAILJET_APIKEY_PRIVATE: "30293203",
            MAILJET_APIKEY_PUBLIC: "30293203",
          }),
        ),
      ),
    ),
  );
});

it("should send email for SES", async () => {
  const SESMailerLive = Layer.succeed(Mailer, new SESMailer());

  await runTest(
    pipe(
      sendTestMail("noreply@theyardbazaar.com", "joseph.owonwo@gmail.com"),
      // Effect.tap(() => Effect.log("SESRequestSuccess")),
      // Effect.tapError((err) => Effect.logFatal("SESRequestFailed", err)),
      Effect.match({
        // This is intentional.
        // I'm not passing in the
        // right credentials
        onSuccess: () => expect.fail(`Shouldn't be successful`),
        onFailure: () => expect(1).toBe(1),
      }),
      Effect.provide(SESMailerLive),
      Effect.provide(
        Layer.setConfigProvider(
          ConfigProvider.fromJson({
            MAIL_HOST: "email-smtp.ca-central-1.amazonaws.com",
            MAIL_PORT: 587,
            MAIL_USERNAME: "<AWS_ACCESS_KEY>",
            MAIL_PASSWORD: "<AWS_API_SECRET_KEY",
          }),
        ),
      ),
    ),
  );
});
