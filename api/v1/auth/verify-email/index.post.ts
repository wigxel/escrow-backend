import { Effect, Layer } from "effect";
import { sendEmailDto } from "~/dto/user.dto";
import { DatabaseLive } from "~/layers/database";
import { OTPRepoLayer } from "~/repositories/otp.repository";
import { UserRepoLayer } from "~/repositories/user.repository";
import { requestEmailVerificationOtp } from "~/services/user.service";

/**
 * @description This endpoint is meant to send an OTP to provided user email for email verification.
 *              if user account exists.
 * @argument    email - A valid email of a user
 */
export default eventHandler(async (event) => {
  const body = await readValidatedBody(event, sendEmailDto);

  const program = requestEmailVerificationOtp(body.email, "verify");
  return Effect.runPromise(
    Effect.scoped(Effect.provide(program, Dependencies)),
  );
});

const Dependencies = Layer.empty.pipe(
  Layer.provideMerge(UserRepoLayer.Repo.Live),
  Layer.provideMerge(OTPRepoLayer),
  Layer.provideMerge(DatabaseLive),
);
