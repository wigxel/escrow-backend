import { Config, Context, Effect, Layer } from "effect";
import type { SentMessage } from "../../layers/mailing/SentMessage";
import { Mailer, type MailingErrors } from "../../layers/mailing/index";
import type { Mailable } from "../../layers/mailing/mailables";
import { Address } from "../../layers/mailing/mailables/Envelope";
import type { AddressUnion } from "../../layers/mailing/types";

export class MailImpl {
  private $to: Address[] = [];
  private $cc: Address[] = [];
  private $bcc: Address[] = [];

  bcc(address: AddressUnion | AddressUnion[]) {
    this.$bcc = this.$bcc.concat(Address.parse(address));
    return this;
  }

  to(address: AddressUnion | AddressUnion[]) {
    this.$to = this.$to.concat(Address.parse(address));
    return this;
  }

  cc(address: AddressUnion | AddressUnion[]) {
    this.$cc = this.$cc.concat(Address.parse(address));
    return this;
  }

  send(mailable: Mailable): Effect.Effect<SentMessage, MailingErrors, Mailer> {
    const { $to, $cc, $bcc } = this;

    return Effect.gen(function* (_) {
      const app_name = yield* Config.string("APP_NAME");
      const default_from_address = yield* Config.string("MAIL_FROM");
      const mailer = yield* Mailer;

      for (const item of $to) mailable.to(item);
      for (const cc of $cc) mailable.cc(cc);
      for (const bcc of $bcc) mailable.bcc(bcc);

      if (!mailable.hasFrom()) {
        mailable.from([default_from_address, app_name]);
      }

      return yield* mailable.send(mailer);
    });
  }
}

export class Mail extends Context.Tag("Mail")<Mail, MailImpl>() {}
export const MailLive = Layer.succeed(Mail, new MailImpl());
