import { Effect, pipe } from "effect";
import { PermissionError } from "~/config/exceptions";
import { loginDto } from "~/dto/user.dto";
import { validateBody } from "~/libs/request.helpers";
import { login, loginWithPhoneNumber } from "~/services/auth.service";
import { runLive } from "~/utils/effect";

export default eventHandler(async (event) => {
  const program = pipe(
    validateBody(event, loginDto),
    Effect.flatMap((body) => {
      if (body.email) return login({ body });
      if (body.phone) return loginWithPhoneNumber({ body });

      return new PermissionError("Provide email or phone number");
    }),
  );

  return runLive(event, program);
});
