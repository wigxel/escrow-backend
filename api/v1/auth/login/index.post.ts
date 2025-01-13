import { Effect, pipe } from "effect";
import { loginDto } from "~/dto/user.dto";
import { validateBody } from "~/libs/request.helpers";
import { login } from "~/services/auth.service";
import { runLive } from "~/utils/effect";

export default eventHandler(async (event) => {
  const program = pipe(
    validateBody(event, loginDto),
    Effect.flatMap((body) => login({ body })),
  );

  return runLive(event, program);
});
