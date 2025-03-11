import { Effect } from "effect";
import { passwordChangeDto } from "~/dto/user.dto";
import { validateBody } from "~/libs/request.helpers";
import { getSessionInfo } from "~/libs/session.helpers";
import { changePassword } from "~/services/auth.service";
import { runLive } from "~/utils/effect";

export default eventHandler(async (event) => {
  const program = Effect.gen(function* (_) {
    const body = yield* validateBody(event, passwordChangeDto);
    const { user } = yield* getSessionInfo(event);

    yield* changePassword({
      currentUser: user,
      oldPassword: body.oldPassword,
      newPassword: body.newPassword,
    });

    return { message: "Password changed successfully" };
  });

  return runLive(event, program);
});
