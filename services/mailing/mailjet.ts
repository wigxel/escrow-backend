import { safeArray, safeObj } from "../../libs/data.helpers";
import type { AxiosError } from "axios";
import { Config, Effect, Layer, pipe } from "effect";
import Mailjet from "node-mailjet";
import { Mailer, MailingError } from "../../layers/mailing";

const readInstance = pipe(
  Config.all([
    Config.string("MAILJET_APIKEY_PUBLIC"),
    Config.string("MAILJET_APIKEY_PRIVATE"),
  ]),
  Config.map(([apiKey, privateKey]) => {
    return Mailjet.apiConnect(apiKey, privateKey);
  }),
  Effect.map((instance) => instance.post("send", { version: "v3.1" })),
  Effect.cached,
);

export const MailjetLive = Layer.effect(
  Mailer,
  Effect.gen(function* SetupMailjet(_) {
    const instance = _(readInstance, Effect.flatten);

    return {
      send(params) {
        return pipe(
          instance,
          Effect.flatMap((instance) =>
            Effect.tryPromise(() => {
              return instance.request({
                Messages: [
                  {
                    From: {
                      Email: params.from.address,
                      Name: params.from.name,
                    },
                    To: safeArray(
                      Array.isArray(params.to) ? params.to : [params.to],
                    )
                      .filter((e) => e)
                      .map((e) => ({
                        Email: e.address,
                        Name: e.name,
                      })),
                    Subject: params.subject,
                    TextPart: params.text,
                    HTMLPart: params.html,
                  },
                ],
              });
            }),
          ),
          Effect.catchTag("UnknownException", (err) => {
            const axiosError = err.error as AxiosError;
            console.assert(
              isAxiosError(axiosError),
              "Unexpected Behaviour: AxiosError but got something else",
            );

            return new MailingError(
              axiosError.response?.data,
              `Error sending email via Mailjet. Status(${axiosError.response?.status})`,
            );

            function isAxiosError(error: unknown) {
              const actualProps = new Set(Object.keys(safeObj(error)));
              const controlProps = [
                "config",
                "response",
                "statusCode",
                "statusText",
                "originalMessage",
              ];
              return controlProps.every((e) => actualProps.has(e));
            }
          }),
          Effect.as(undefined),
        );
      },
    };
  }),
);
