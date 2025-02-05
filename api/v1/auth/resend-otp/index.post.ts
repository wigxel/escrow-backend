import { Effect } from "effect";
import { sendEmailDto } from "~/dto/user.dto";
import { validateBody } from "~/libs/request.helpers";
import { resendEmailVerificationOtp } from "~/services/user.service";

export default eventHandler(async (event) => {
  const program = validateBody(event, sendEmailDto).pipe(
    Effect.flatMap((body) => resendEmailVerificationOtp(body.email)),
  );
  return runLive(event, program);
});
