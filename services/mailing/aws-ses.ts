import {
  SESv2Client,
  SendEmailCommand,
  type SendEmailCommandInput,
} from "@aws-sdk/client-sesv2";
import { Config, Effect, Redacted, pipe } from "effect";
import {
  Mailer,
  MailerConfig,
  type MailerInterface,
  MailingError,
} from "../../layers/mailing";
import type { MailAddress, SendMailParams } from "../../layers/mailing/types";

const sesClient = pipe(
  MailerConfig,
  Config.map(([host, port, username, password]) => {
    const region = host.match(/.*\.([a-z0-9\-]*)\.amazonaws.com/)?.[1];
    return new SESv2Client({
      region: region ?? host,
      credentials: {
        accessKeyId: username,
        secretAccessKey: Redacted.value(password),
      },
    });
  }),
  Effect.cached,
);

export class SESMailer implements MailerInterface {
  send(params: SendMailParams) {
    return Effect.gen(function* (_) {
      const client = yield* _(sesClient, Effect.flatten);

      const encodeMailAddress = (mailAddr: MailAddress) => {
        return mailAddr.toString();
      };

      const addresses = (items: MailAddress | MailAddress[]) => {
        return [items].flat().filter((e) => e);
      };

      const options = {
        Content: {
          Simple: {
            Body: {
              Text: params.text
                ? { Charset: "UTF-8", Data: params.text.toString() }
                : undefined,
              Html: params.html
                ? { Charset: "UTF-8", Data: params.html.toString() }
                : undefined,
            },
            Subject: {
              Data: params.subject,
              Charset: "UTF-8",
            },
          },
        },
        Destination: {
          ToAddresses: addresses(params.to).map(encodeMailAddress),
          BccAddresses: undefined,
          CcAddresses: undefined,
        },
        FromEmailAddress: params.from.address,
        ReplyToAddresses: addresses(params.replyTo).map(encodeMailAddress),
        FromEmailAddressIdentityArn: undefined, // optional
        EmailTags: [],
        ListManagementOptions: undefined,
        FeedbackForwardingEmailAddress: undefined, // optional
        FeedbackForwardingEmailAddressIdentityArn: undefined, // optional
      } satisfies SendEmailCommandInput;

      return yield* pipe(
        Effect.tryPromise((signal) => {
          return client.send(new SendEmailCommand(options), {
            abortSignal: signal,
          });
        }),
        Effect.catchTag("UnknownException", ({ error, message }) => {
          return new MailingError(error, "Error sending mail via SES");
        }),
        Effect.as(undefined),
      );
    });
  }
}
