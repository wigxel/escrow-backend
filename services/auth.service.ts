import { Effect } from "effect";
import { ExpectedError, PermissionError } from "~/config/exceptions";
import { hashPassword, verifyPassword } from "~/layers/encryption/helpers";
import { Session } from "~/layers/session";
import type { SessionUser } from "~/layers/session-provider";
import { dataResponse } from "~/libs/response";
import { UserRepoLayer } from "~/repositories/user.repository";

export function login({
  body,
}: { body: Partial<{ email: string; password: string }> }) {
  return Effect.gen(function* (_) {
    const session = yield* Session;
    const userRepo = yield* UserRepoLayer.Tag;

    yield* _(Effect.logDebug("Getting authenticated User"));
    yield* _(Effect.logDebug("Getting authenticated User"));
    const userDetails = yield* _(
      userRepo.firstOrThrow({ email: body.email }),
      Effect.mapError(
        () => new PermissionError("Invalid username or password provided"),
      ),
    );

    yield* Effect.logDebug("Verify password");

    yield* _(
      verifyPassword(body.password, userDetails?.password ?? ""),
      Effect.mapError(
        () => new PermissionError("Invalid username or password provided"),
      ),
    );

    if (!userDetails.emailVerified) {
      yield* new ExpectedError(
        `Please verify your email ${body.email}. We sent a verification email to your inbox`,
      );
    }

    yield* Effect.logDebug("Creating session");
    const { session_id, expires_at } = yield* _(session.create(userDetails.id));

    yield* Effect.logDebug("Session created");

    return dataResponse({
      data: {
        access_token: session_id,
        expires: expires_at.toISOString(),
      },
      message: "Login successful",
    });
  });
}

export function loginWithPhoneNumber({
  body,
}: {
  body: Partial<{
    phone: string;
    password: string;
  }>
}) {
  return Effect.gen(function* (_) {
    const session = yield* Session;
    const userRepo = yield* UserRepoLayer.Tag

    const error = new PermissionError("Invalid username or password provided");

    yield* _(Effect.logDebug("Getting authenticated User by phone"));
    const user = yield* _(
      userRepo.firstOrThrow({
        phone: body.phone
      }),
      Effect.mapError(() => error),
    );

    yield* Effect.logDebug("Verify password");

    yield* _(
      verifyPassword(body.password, user?.password ?? ""),
      Effect.mapError(
        () => new PermissionError("Invalid username or password provided"),
      ),
    );

    yield* Effect.logDebug("Creating session");
    const { session_id, expires_at } = yield* _(session.create(user.id));

    yield* Effect.logDebug("Session created");

    return dataResponse({
      data: {
        access_token: session_id,
        expires: expires_at.toISOString(),
      },
      message: "Login successful",
    });
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

    yield* _(
      verifyPassword(params.oldPassword, userDetails.password),
      Effect.catchTag("PasswordHasherError", () => {
        // @todo: Severity High - Count login attempts and block user if too many attempts
        return new PermissionError("Invalid password provided");
      })
    )

    yield* Effect.log("Hashing new password");
    const newHash = yield* hashPassword(params.newPassword);
    yield* Effect.log("Hashing new password");
    const [user] = yield* userRepo.update(userDetails.id, { password: newHash });

    return dataResponse({ message: "Password changed successful" });
  });
};

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
