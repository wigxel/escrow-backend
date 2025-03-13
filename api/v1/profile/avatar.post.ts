import { Effect, Option, pipe } from "effect";
import { ExpectedError } from "../../../config/exceptions";
import { getSessionInfo } from "../../../libs/session.helpers";
import { uploadAvatarImage } from "../../../services/profile.service";

export default eventHandler((event) => {
  const updateProfileProgram = pipe(
    Effect.Do,
    Effect.bind("session", () => getSessionInfo(event)),
    Effect.bind("avatar", () => {
      return pipe(
        Effect.tryPromise(() => readFormData(event)),
        Effect.flatMap((e) => Option.fromNullable(e.get("file"))),
        Effect.map((e) => e as File),
        Effect.flatMap(validateFile),
        Effect.catchTag("NoSuchElementException", () => {
          return new ExpectedError(
            "Expected form-data to contain a `file` field",
          );
        }),
      );
    }),
    Effect.bind("profile", (e) => {
      return uploadAvatarImage(e.session.user.id, e.avatar);
    }),
    Effect.map((r) => {
      return r.profile;
    }),
  );

  return runLive(event, updateProfileProgram);
});

export function validateFile(file: File) {
  return ["image/jpeg", "image/png", "image/jpg"].includes(file.type)
    ? Effect.succeed(file)
    : new ExpectedError(`Invalid photo file upload ${file.type}`);
}
