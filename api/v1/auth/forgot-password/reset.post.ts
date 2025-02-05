import { Effect, pipe } from "effect";
import { passwordResetDto } from "~/dto/user.dto";
import { validateBody } from "~/libs/request.helpers";
import { passwordReset } from "~/services/user.service";
import { runLive } from "~/utils/effect";

export default eventHandler(async (event) => {
  const program = pipe(
    validateBody(event, passwordResetDto),
    Effect.flatMap((body) => {
      return passwordReset({ otp: body.otp, password: body.password });
    }),
  );

  return runLive(event, program);
});
