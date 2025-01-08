import { Config, Effect, Exit, Runtime, pipe } from "effect";
import nodemailer from "nodemailer";
import type { SendMailRaw } from "~/types/types";

const MailConfig = Effect.gen(function* () {
  const env = yield* Config.string("APP_ENV");
  const host = yield* Config.string("MAIL_HOST");
  const port = yield* Config.number("MAIL_PORT");
  const user = yield* Config.string("MAIL_USERNAME");
  const pass = yield* Config.string("MAIL_PASSWORD");
  const from = yield* Config.string("MAIL_FROM");

  return {
    host,
    port,
    user,
    pass,
    from,
    secure: env === "production",
  };
});

/** @deprecated use Mail.send */
export const sendmail = (options: SendMailRaw) => {
  // TODO: Introduce an Observable for handling email task
  return Effect.gen(function* (_) {
    const smtpCredentials = yield* MailConfig;
    const transporter = yield* MailTransporter;
    const canSendEmail = yield* Config.boolean("ENABLE_MAILING").pipe(
      Config.withDefault(true),
    );

    if (!options.from) {
      options.from = { name: "Wigxel", address: smtpCredentials.from };
    }

    if (!canSendEmail) {
      return "Skipping email";
    }

    const runtime = yield* Effect.runtime<never>();
    const runPromiseExit = Runtime.runPromiseExit(runtime);

    // Temporary solution: Run on a different fiber and ignore failure
    runPromiseExit(
      pipe(
        Effect.tryPromise({
          try: async () => {
            // TODO: Introduce a Queue for sendingMail
            await transporter.sendMail(options);
            return Promise.resolve({});
          },
          catch: (unknown) => new Error(`Couldn't send mail ${unknown}`),
        }),
        Effect.timeout("30 seconds"),
      ),
    ).then((exit) => {
      pipe(
        exit,
        Exit.match({
          onSuccess: () => {},
          onFailure: (err) => console.error("Email task failed", err),
        }),
      );
    });

    return "Scheduled for sending...";
  });
};

const MailTransporter = Effect.gen(function* (_) {
  const { host, port, user, pass, secure } = yield* MailConfig;

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });
});
