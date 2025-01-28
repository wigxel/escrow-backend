import { safeObj } from "@repo/shared/src/data.helpers";
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
                  message: error.message,
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
            onSuccess: (d) =>
              ({ data: d ?? null, status: 200, message: "" }) as unknown as {
                data: A;
                status: number;
                message: string;
              },
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
