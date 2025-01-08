import { Match, pipe } from "effect";

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export function resolveErrorResponse(error: any) {
  return pipe(
    Match.value(error),
    Match.tag("ValidationError", (validation_err) => {
      return validation_err.toJSON();
    }),
    Match.orElse((unknown_err) => unknown_err),
  );
}
