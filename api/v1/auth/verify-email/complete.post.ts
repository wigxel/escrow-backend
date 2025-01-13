import { Effect, Layer } from "effect";
import { verifyEmailDto } from "~/dto/user.dto";
import { DatabaseLive } from "~/layers/database";
import { validateBody } from "~/libs/request.helpers";
import { OTPRepoLayer } from "~/repositories/otp.repository";
import { UserRepoLayer } from "~/repositories/user.repository";
import { verifyUserEmail } from "~/services/user.service";
import { runLive } from "~/utils/effect";

/**
 * @description Marks creator (user) email of provided otp as verified.
 * @argument    otp - A valid otp sent to user's email
 */
export default eventHandler(async (event) => {
  const program = validateBody(event, verifyEmailDto).pipe(
    Effect.flatMap((body) => verifyUserEmail(body.otp)),
  );

  return runLive(event, Effect.scoped(Effect.provide(program, Dependencies)));
});

const Dependencies = Layer.empty.pipe(
  Layer.provideMerge(UserRepoLayer.Repo.Live),
  Layer.provideMerge(OTPRepoLayer),
  Layer.provideMerge(DatabaseLive),
);
