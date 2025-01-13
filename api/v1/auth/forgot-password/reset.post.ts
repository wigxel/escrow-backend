import { Effect, pipe } from "effect";
import { passwordResetDto } from "~/dto/user.dto";
import { validateBody } from "~/libs/request.helpers";
import { passwordReset } from "~/services/user.service";
import { runLive } from "~/utils/effect";

/**
 * @description Reset user password by providing a valid otp and new password.
 * @argument    otp - A valid otp sent to user's email
 * @argument    password - New password for user
 */
export default eventHandler(async (event) => {
  const program = pipe(
    validateBody(event, passwordResetDto),
    Effect.flatMap((body) => {
      return passwordReset({ otp: body.otp, password: body.password });
    }),
  );

  return runLive(event, program);
});
