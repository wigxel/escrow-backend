import { Effect } from "effect";
import { sendEmailDto } from "~/dto/user.dto";
import { validateBody } from "~/libs/request.helpers";
import { forgotPassword } from "~/services/user.service";

const success_payload = {
  status: "success",
  message: "Forget password successful",
};

export default eventHandler(async (event) => {
  const program = validateBody(event, sendEmailDto.pick({ identifier: true })).pipe(
    Effect.flatMap((body) => forgotPassword(body.identifier)),
    Effect.map(() => success_payload),
    Effect.catchTag("NoSuchElementException", () => {
      return Effect.succeed(success_payload);
    }),
  );

  return runLive(event, program);
});
