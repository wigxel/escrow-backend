import { Config, type ConfigError, Context, type Effect } from "effect";
import { TaggedError } from "effect/Data";
import type { SentMessage } from "../../layers/mailing/SentMessage";
import type { SendMailParams } from "../../layers/mailing/types";

export const MailerConfig = Config.all([
  Config.string("MAIL_HOST"),
  Config.number("MAIL_PORT"),
  Config.string("MAIL_USERNAME"),
  Config.redacted("MAIL_PASSWORD"),
]);

export class Mailer extends Context.Tag("Mailer")<Mailer, MailerInterface>() {}

export type MailingErrors = MailingError | ConfigError.ConfigError;
export interface MailerInterface {
  send(
    params: SendMailParams,
  ): Effect.Effect<SentMessage | undefined, MailingErrors>;
}

export class MailingError extends TaggedError("MailingError") {
  constructor(
    public error: unknown,
    public message: string,
  ) {
    super();
  }
}
