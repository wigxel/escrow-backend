import { Effect, pipe } from "effect";
import { getSessionInfo } from "~/libs/session.helpers";
import { getProfile } from "~/services/profile.service";

export default eventHandler(async (event) => {
  const program = pipe(
    getSessionInfo(event),
    Effect.flatMap((session) => getProfile(session.user.id)),
    Effect.map((profile) => {
      const { password, ...user } = profile;
      return user;
    }),
  );

  return runLive(event, program);
});
