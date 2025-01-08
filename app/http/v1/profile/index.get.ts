import { Effect, pipe } from "effect";
import { getSessionInfo } from "~/libs/session.helpers";
import { UserRepoLayer } from "~/repositories/user.repository";
import { getProfile } from "~/services/profile.service";

export default eventHandler(async (event) => {
  const getProfileProgram = pipe(
    getSessionInfo(event),
    Effect.flatMap((session) => getProfile(session.user.id)),
    Effect.map((profile) => {
      const { password, ...user } = profile;
      return {
        success: true,
        message: "User profile",
        data: user,
      };
    }),
  );

  return runLive(
    event,
    Effect.provide(getProfileProgram, UserRepoLayer.Repo.Live),
  );
});
