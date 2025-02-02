import { Effect, Layer, pipe } from "effect";
import { updateUserDto } from "~/dto/user.dto";
import { DatabaseLive } from "~/layers/database";
import { validateBody } from "~/libs/request.helpers";
import { getSessionInfo } from "~/libs/session.helpers";
import { UserRepoLayer } from "~/repositories/user.repository";
import { editProfile } from "~/services/profile.service";

export default eventHandler(async (event) => {
  const updateProfileProgram = pipe(
    Effect.Do,
    Effect.bind("session", () => getSessionInfo(event)),
    Effect.bind("body", () => validateBody(event, updateUserDto)),
    Effect.bind("profile", (e) => editProfile(e.session.user.id, e.body)),
    Effect.map(({ profile }) => {
      const { password, ...user } = profile;
      return user;
    }),
  );

  return runLive(event, updateProfileProgram);
});
