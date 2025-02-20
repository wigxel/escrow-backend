import { Effect } from "effect";
import { NoSuchElementException } from "effect/Cause";
import {
  SessionProvider,
  type SessionProviderImpl,
} from "~/layers/session-provider";
import { extendMockImplementation } from "~/tests/mocks/helpers";

export const Mock: SessionProviderImpl = {
  createSession: (user_id: string) => {
    return Effect.succeed({
      session_id: "MOCK_SESSION_ID",
      expires_at: new Date(2024, 6, 30),
    });
  },
  validateSession: (session_id: string) => {
    return Effect.fail(new NoSuchElementException("Invalid session"));
  },
  invalidateSession: (session_id: string): Effect.Effect<void> => {
    return Effect.void;
  },
  invalidateUserSessions: (user_id: string): Effect.Effect<void> => {
    return Effect.void;
  },
};

export const extendSessionProvider = extendMockImplementation(
  SessionProvider,
  () => ({ ...Mock }),
);

export const SessionProviderTest = extendSessionProvider({});
