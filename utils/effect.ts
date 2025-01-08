import { safeObj } from "@repo/shared/src/data.helpers";
import { Effect, Layer, Match, type Scope, pipe } from "effect";
import { ConfigProvider } from "effect";
// @ts-expect-error
import type { H3Event } from "h3";
import { AppLive } from "~/config/app";
import type { AppExceptions } from "~/config/exceptions";
import { resolveErrorResponse } from "~/libs/response";
import type { InferRequirements } from "~/services/effect.util";

/**
 * Runs the Effect program with the `AppLive` as the Requirements and `NewModelDatabase` as Scope
 * @param event {H3Event}
 * @param effect {Effect.Effect}
 */
export const runLive = <
  A extends Record<string, unknown>,
  E,
  R extends InferRequirements<typeof AppLive> | Scope.Scope,
  TEvent extends H3Event<unknown>,
>(
  event: TEvent,
  effect: Effect.Effect<A, E, R>,
) => {
  const program = effect as Effect.Effect<
    A,
    AppExceptions,
    InferRequirements<typeof AppLive>
  >;

  const ConfigLayer = readConfigLayer(event);

  const app = pipe(
    program.pipe(
      Effect.tapError((reason) => Effect.logDebug("RequestError", reason)),
      Effect.mapError((error) => {
        return pipe(
          Match.value(error),
          Match.tag("ValidationError", (error) => {
            setResponseStatus(event, 422);
            return error;
          }),
          Match.tag("PermissionError", (permission_err) => {
            return createError({
              status: 401,
              statusMessage: "Unauthorized",
              message: permission_err.message,
            });
          }),
          Match.orElse((err) =>
            createError({
              status: 400,
              statusMessage: "Bad Request",
              message: err.message,
            }),
          ),
        );
      }),
    ),
    Effect.match({
      onSuccess: (d) => d as unknown as A,
      onFailure: resolveErrorResponse,
    }),
    Effect.provide(AppLive),
    Effect.provide(ConfigLayer),
    Effect.scoped,
  );

  return Effect.runPromise(app);
};

export function runSync<A, E, R extends never>(
  event: H3Event,
  effect: Effect.Effect<A, E, R>,
) {
  const program = pipe(effect, Effect.provide(readConfigLayer(event)));

  return Effect.runSync(program);
}

function readConfigLayer(event: H3Event) {
  const runtimeConfig = useRuntimeConfig(event);

  const appConfig = pipe(
    runtimeConfig,
    ConfigProvider.fromJson,
    ConfigProvider.snakeCase,
    ConfigProvider.upperCase,
  );

  return Layer.setConfigProvider(appConfig);
}

export const NitroApp = Object.freeze({
  runSync,
  runPromise: runLive,
});

export const resolveError = (err: unknown) => {
  if (typeof err === "string") return new Error(err);
  if (err instanceof Error) return err;
  const errorObj = safeObj(err);

  if ("message" in errorObj) {
    return Error(errorObj.message);
  }

  return new Error("Unknown error");
};
