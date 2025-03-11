import { Effect } from "effect";
import { verifyEmailDto } from "~/dto/user.dto";
import { validateBody } from "~/libs/request.helpers";
import { verifyUserEmail } from "~/services/user.service";
import { runLive } from "~/utils/effect";

export default eventHandler(async (event) => {
  const program = validateBody(event, verifyEmailDto).pipe(
    Effect.flatMap((body) => verifyUserEmail(body)),
  );

  return runLive(event, program);
});
