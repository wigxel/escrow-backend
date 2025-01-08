import { Effect } from "effect";
import { sendEmailDto } from "~/dto/user.dto";
import { requestEmailVerificationOtp } from "~/services/user.service";

/**
 * @description This endpoint is meant to send an OTP to provided user email for email verification.
 *              if user account exists.
 * @argument    email - A valid email of a user
 */
export default eventHandler(async (event) => {
  const body = await readValidatedBody(event, sendEmailDto);
  const program = requestEmailVerificationOtp(body.email, "verify");

  return NitroApp.runPromise(event, Effect.scoped(program));
});
