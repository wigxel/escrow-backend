import { pipe } from "effect";
import { passwordChangeDto } from "~/dto/user.dto";
import { changePassword } from "~/services/auth.service";
import { runLive } from "~/utils/effect";

export default eventHandler(async (event) => {
  const userId = event.context.user?.id;
  const body = await readValidatedBody(event, passwordChangeDto);

  const updateProfileProgram = pipe(
    changePassword(userId, body.password, body.newPassword),
  );

  return runLive(event, updateProfileProgram);
});
