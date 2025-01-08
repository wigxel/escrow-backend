import { Config, Effect, Redacted } from "effect";
import nodemailer from "nodemailer";
import {
  MailerConfig,
  type MailerInterface,
  MailingError,
} from "~/layers/mailing";
import type { MailAddress, SendMailParams } from "~/layers/mailing/types";

export class NodeMailer implements MailerInterface {
  send(params: SendMailParams) {
    return Effect.gen(function* (_) {
      const [host, port, username, password] = yield* MailerConfig;
      const appName = yield* Config.string("APP_NAME");

      const transporterParams = {
        host: host,
        port: port,
        auth: {
          user: username,
          pass: Redacted.value(password),
        },
      };

      const transporter = nodemailer.createTransport(transporterParams);

      const addresses = (items: MailAddress | MailAddress[]) => {
        return [items].flat().filter((e) => e);
      };

      yield* Effect.tryPromise({
        try: () => {
          return transporter.sendMail({
            ...params,
            text: params.text,
            html: params.html,
            watchHtml: params.watchHtml,
            subject: params.subject,
            sender: params.sender?.address ?? null,
            cc: addresses(params.cc).map((address) => address.toString()),
            bcc: addresses(params.bcc).map((address) => address.toString()),
            replyTo: addresses(params.replyTo).map((address) =>
              address.toString(),
            ),
            inReplyTo: params.inReplyTo?.address ?? null,
            from: `${appName} <${params.from.address}>`,
            to: addresses(params.to).map((address) => address.toString()),
          });
        },
        catch: (err) => {
          return new MailingError(err, "Error sending mail");
        },
      });

      return undefined;
    });
  }
}
