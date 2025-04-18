import { safeObj } from "~/libs/data.helpers";
import { type Cause, Effect, pipe } from "effect";
import type { H3Event } from "h3";
import type { SafeParseReturnType, z } from "zod";
import { ValidationError } from "~/config/exceptions";

export function validateZod<TSuccess>(
  fn: () =>
    | SafeParseReturnType<TSuccess, unknown>
    | Promise<SafeParseReturnType<TSuccess, unknown>>,
  option?: { failureMessage?: string },
): Effect.Effect<TSuccess, ValidationError | Cause.UnknownException, never> {
  return pipe(
    Effect.tryPromise(() => Promise.resolve(fn())),
    Effect.flatMap((result) => {
      if (result.success === false) {
        return new ValidationError(result, option?.failureMessage);
      }
      return Effect.succeed(result.data as TSuccess);
    }),
  );
}

export const validateBody = <T>(event: H3Event, schema: z.Schema<T>) =>
  pipe(
    Effect.tryPromise({
      try: () => readBody(event) as Promise<unknown>,
      catch: () => new Error("Error reading Request Body"),
    }),
    Effect.flatMap((body) =>
      validateZod(async () => schema.safeParseAsync(safeObj(body))),
    ),
  );

export const validateQuery = <T>(event: H3Event, schema: z.Schema<T>) =>
  Effect.suspend(() =>
    validateZod(async () => schema.safeParseAsync(await getQuery(event))),
  );

export const validateParams = <T>(schema: z.Schema<T>, data: unknown) =>
  Effect.suspend(() =>
    validateZod<z.infer<typeof schema>>(async () =>
      schema.safeParse(safeObj(data)),
    ),
  );
