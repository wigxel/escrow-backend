import { Effect, pipe } from "effect";
import { PermissionError } from "~/config/exceptions";
import { AuthUser } from "~/layers/auth-user";
import { hashPassword, verifyPassword } from "~/layers/encryption/helpers";
import { Session } from "~/layers/session";
import type { SessionUser } from "~/layers/session-provider";
import { UserRepoLayer } from "~/repositories/user.repository";

export function logout({ access_token }: { access_token: string }) {
  return Effect.gen(function* (_) {
    const session = yield* Session;
    const response = { message: "Session terminated" } as const;

    // validate authorization token
    return yield* _(
      session.validate(access_token),
      Effect.flatMap(() => session.invalidate(access_token)),
      Effect.match({
        onSuccess: () => response,
        onFailure: () => response,
      }),
    );
  });
}

export function login({
  body,
}: { body: Partial<{ email: string; password: string }> }) {
  return Effect.gen(function* (_) {
    const session = yield* Session;
    const auth_user = yield* AuthUser;
    const error = new PermissionError("Invalid username or password provided");

    yield* _(Effect.logDebug("Getting authenticated User"));
    const user = yield* _(
      pipe(
        auth_user.getUserRecord({ email: body.email }),
        Effect.mapError(() => error),
      ),
    );

    yield* Effect.logDebug("Verify password");

    yield* _(
      verifyPassword(body.password, user?.password ?? ""),
      Effect.mapError(() => error),
    );

    yield* Effect.logDebug("Creating session");
    const { session_id, expires_at } = yield* _(
      session.create(user.user_id),
      Effect.mapError(() => error),
    );

    yield* Effect.logDebug("Session created");

    return {
      access_token: session_id,
      expires: expires_at.toISOString(),
    };
  });
}

export const changePassword = (params: {
  currentUser: SessionUser;
  oldPassword: string;
  newPassword: string;
}) => {
  return Effect.gen(function* (_) {
    const userRepo = yield* UserRepoLayer.Tag;
    const userDetails = yield* userRepo.firstOrThrow({
      id: params.currentUser.id,
    });

    yield* verifyPassword(params.oldPassword, userDetails.password);
    const newHash = yield* hashPassword(params.newPassword);
    const [user] = yield* userRepo.update(userDetails.id, { password: newHash });

    return user;
  });
};
