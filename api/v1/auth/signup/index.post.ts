import { Effect, pipe } from "effect";
import { createUserDto } from "../../../../dto/user.dto";
import { validateBody } from "../../../../libs/request.helpers";
import { createUser } from "../../../../services/user.service";
import { runLive } from "../../../../utils/effect";

/**
 * @description Create user account with email, password, etc.
 * @returns new user data
 */
export default eventHandler(async (event) => {
  const program = pipe(
    validateBody(event, createUserDto),
    Effect.flatMap((body) => createUser(body)),
  );

  return runLive(event, program);
});
