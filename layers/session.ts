import { Context, Effect, Layer, pipe } from "effect";
import type { NoSuchElementException, UnknownException } from "effect/Cause";
import type { DatabaseConnection } from "../config/database";
import {
  type SessionInfo,
  SessionProvider,
  type SessionUser,
} from "../layers/session-provider";
import { runDrizzleQuery } from "../libs/query.helpers";
import type { User } from "../migrations/schema";

type SessionError = UnknownException | Error;

export interface SessionImpl {
  getUser(user: {
    id: string;
  }): Effect.Effect<User | null, SessionError, DatabaseConnection>;

  create(
    user_id: string,
  ): Effect.Effect<
    { session_id: string; expires_at: Date },
    UnknownException | NoSuchElementException,
    SessionProvider
  >;

  validate(
    token: string,
  ): Effect.Effect<
    { session: SessionInfo; user: SessionUser },
    UnknownException | NoSuchElementException,
    SessionProvider
  >;

  invalidate(token: string): Effect.Effect<void, never, SessionProvider>;
}

export class Session extends Context.Tag("Session")<Session, SessionImpl>() {}

//user session implementation
const UserLive: SessionImpl = {
  create(user_id: string) {
    return Effect.gen(function* (_) {
      const sessionProvider = yield* SessionProvider;
      return yield* sessionProvider.createSession(user_id);
    });
  },

  validate(token: string) {
    return Effect.gen(function* (_) {
      const sessionProvider = yield* SessionProvider;

      return yield* sessionProvider.validateSession(token);
    });
  },

  getUser(user: { id: string }) {
    return runDrizzleQuery<User>((db) =>
      db.query.userTable.findFirst({
        where: (cols, { eq }) => eq(cols.id, user.id),
      }),
    );
  },

  invalidate(session_id: string) {
    return pipe(
      SessionProvider,
      Effect.flatMap((provider) => provider.invalidateSession(session_id)),
    );
  },
};

export const UserSessionLive = Layer.succeed(Session, UserLive);
