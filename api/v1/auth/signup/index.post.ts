import { Effect, Layer, pipe } from "effect";
import { createUserDto } from "~/dto/user.dto";
import { DatabaseLive } from "~/layers/database";
import { UserSessionLive } from "~/layers/session";
import { validateBody } from "~/libs/request.helpers";
import { OTPRepoLayer } from "~/repositories/otp.repository";
import { UserRepoLayer } from "~/repositories/user.repository";
import { createUser } from "~/services/user.service";
import { runLive } from "~/utils/effect";

/**
 * @description Create user account with email, password, etc.
 * @returns new user data
 */
export default eventHandler(async (event) => {
  const program = pipe(
    validateBody(event, createUserDto),
    Effect.flatMap((body) =>
      createUser({
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        password: body.password,
        phone: body.phone,
        role: body.role,
        profilePicture: body.profilePicture ?? "",
        emailVerified: false,
      }),
    ),
    Effect.map(({ session }) => {
      return {
        success: true,
        message: "User created successfully",
        data: {
          access_token: session.session_id,
          expires: session.expires_at.toISOString(),
        },
      };
    }),
  );

  return runLive(event, Effect.scoped(Effect.provide(program, Dependencies)));
});

const Dependencies = Layer.empty.pipe(
  Layer.provideMerge(UserRepoLayer.Repo.Live),
  Layer.provideMerge(OTPRepoLayer),
  Layer.provideMerge(DatabaseLive),
  Layer.provideMerge(UserSessionLive),
);
