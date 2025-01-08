import { Cause, Exit, pipe } from "effect";
import { getBearerToken, validateSession } from "~/libs/session.helpers";

export default defineEventHandler(async (event) => {
  const { pathname } = getRequestURL(event);

  // protect all / endpoints except /auth
  if (pathname.includes("/") && !pathname.includes("/auth")) {
    const token = getBearerToken(getHeaders(event));

    const program = validateSession(token);
    const response = await NitroApp.runPromise(event, program);

    pipe(
      response,
      Exit.match({
        onSuccess: ({ user, session }) => {
          event.context.user = user;
          event.context.session = session;
        },
        onFailure: (cause) => {
          // TODO: Remove all `event.context.user` references from the controllers and refactor this middleware
          createError({
            status: 401,
            statusMessage: "Unauthorized",
            message: Cause.pretty(cause),
          });
        },
      }),
    );
  }
});
