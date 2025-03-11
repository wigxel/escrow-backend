import { safeObj } from "~/libs/data.helpers";
import { Effect, Match, type Scope, pipe } from "effect";
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
  A,
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

  return Effect.runPromise(
    Effect.scoped(
      Effect.provide(
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
              Match.tag("UnknownException", (error) => {
                return createError({
                  status: 401,
                  statusMessage: "UnknownException",
                  message: error.cause as string,
                });
              }),
              Match.orElse((err) => {
                return createError({
                  status: 400,
                  statusMessage: "Bad Request",
                  message: err.message,
                });
              }),
            );
          }),
          Effect.match({
            onSuccess: (d) => d as unknown as A,
            onFailure: resolveErrorResponse,
          }),
        ),
        AppLive,
      ),
    ),
  );
};

export const resolveError = (err: unknown) => {
  if (typeof err === "string") return new Error(err);
  if (err instanceof Error) return err;
  const errorObj = safeObj(err);

  if ("message" in errorObj) {
    return Error(errorObj.message);
  }

  return new Error("Unknown error");
};

export function defineAppHandler<
  A,
  E,
  R extends InferRequirements<typeof AppLive> | Scope.Scope,
>(effect_fn: (event: H3Event) => Effect.Effect<A, E, R>) {
  return defineEventHandler(async (event) => {
    return await runLive(event, effect_fn(event));
  });
}
