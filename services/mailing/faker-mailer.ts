import { Config, Effect } from "effect";
import { type MailerInterface, MailingError } from "../../layers/mailing";
import type { MailAddress, SendMailParams } from "../../layers/mailing/types";

export class FakeMaker implements MailerInterface {
  send(params: SendMailParams) {
    return Effect.gen(function* (_) {
      const appName = yield* Config.string("APP_NAME");

      const addresses = (items: MailAddress | MailAddress[]) => {
        return [items].flat().filter((e) => e);
      };

      yield* Effect.tryPromise({
        try: () => {
          return Promise.resolve({
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
          return new MailingError(err, "Error sending mail via FakeMailer");
        },
      });

      return undefined;
    });
  }
}
