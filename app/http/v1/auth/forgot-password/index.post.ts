import { sendEmailDto } from "~/dto/user.dto";
import { requestEmailVerificationOtp } from "~/services/user.service";

/**
 * @description This endpoint is meant to send an OTP to provided user email for resetting password.
 *              if user account exists.
 * @argument    email - A valid email of a user
 */
export default eventHandler(async (event) => {
  const body = await readValidatedBody(event, sendEmailDto);
  const program = requestEmailVerificationOtp(body.email, "reset");

  return NitroApp.runPromise(event, program);
});
