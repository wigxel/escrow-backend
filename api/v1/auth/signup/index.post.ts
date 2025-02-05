import { Effect, pipe } from "effect";
import { createUserDto } from "~/dto/user.dto";
import { validateBody } from "~/libs/request.helpers";
import { createUser } from "~/services/user.service";
import { runLive } from "~/utils/effect";

/**
 * @description Create user account with email, password, etc.
 * @returns new user data
 */
export default eventHandler(async (event) => {
  const program = pipe(
    validateBody(event, createUserDto),
    Effect.flatMap((body) => createUser(body)),
    Effect.map(({ session }) => {
      return {
        success: true,
        message: "User created successfully",
        data: {
          access_token: session.session_id,
          expires: session.expires_at.toISOString(),
        },
      };
    }),
  );

  return runLive(event, program);
});
