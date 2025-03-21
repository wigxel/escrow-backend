import { Effect } from "effect";
import { sendEmailDto } from "~/dto/user.dto";
import { validateBody } from "~/libs/request.helpers";
import { resendOtp } from "~/services/user.service";

export default eventHandler(async (event) => {
  const program = validateBody(event, sendEmailDto).pipe(
    Effect.flatMap((body) => resendOtp(body.identifier, body.type)),
  );
  return runLive(event, program);
});
