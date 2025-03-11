import { Context, type Effect } from "effect";
import type { NoSuchElementException, UnknownException } from "effect/Cause";

export interface SessionUser {
  id: string;
  role?: string;
  email: string;
  username: string;
  phone: string;
}

export interface SessionInfo {
  id: string;
  expiresAt: Date;
  fresh: boolean;
  userId: string;
}

export type SessionProviderImpl = {
  createSession(user_id: string): Effect.Effect<
    {
      session_id: string;
      expires_at: Date;
    },
    UnknownException
  >;

  validateSession(
    session_id: string,
  ): Effect.Effect<
    { user: SessionUser; session: SessionInfo },
    UnknownException | NoSuchElementException
  >;

  invalidateSession(session_id: string): Effect.Effect<void>;

  invalidateUserSessions(user_id: string): Effect.Effect<void>;
};

export class SessionProvider extends Context.Tag("SessionProvider")<
  SessionProvider,
  SessionProviderImpl
>() {}
