import { Effect } from "effect";
// @ts-expect-error
import type { H3Event, HTTPHeaderName } from "h3";
import { PermissionError } from "~/config/exceptions";
import { Session } from "~/layers/session";

export function getBearerToken(
  headers: Partial<Record<HTTPHeaderName, string>>,
) {
  const access_token = (headers?.authorization ?? "").split(" ")[1];
  return access_token ?? "";
}

export function getAuthUser(params: { token: string }) {
  return Effect.gen(function* (_) {
    const session = yield* Session;
    const data = yield* _(validateSession(params.token));
    const user = yield* session.getUser({ id: data.user.id });

    return user;
  });
}

export function validateSession(token: string) {
  return Effect.gen(function* (_) {
    const session = yield* Session;

    yield* _(Effect.logTrace(`Validating Token: ${token}`));

    return yield* _(
      session.validate(token), // Query -> 50ms
      Effect.mapError(
        () => new PermissionError("Access denied. Session unrecognized"),
      ),
    );
  });
}

export function getSessionInfo(event: H3Event<unknown>) {
  return Effect.gen(function* (_) {
    const token = getBearerToken(getHeaders(event));
    return yield* validateSession(token);
  }).pipe(Effect.tap(Effect.log("Reading session")));
}
