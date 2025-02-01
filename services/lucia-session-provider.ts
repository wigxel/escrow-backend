/*
  Sets up lucia authentication
  @params adapter
*/
import { DrizzlePostgreSQLAdapter } from "@lucia-auth/adapter-drizzle";
import { Config, Effect, Layer, pipe } from "effect";
import { NoSuchElementException } from "effect/Cause";
import { isNullable } from "effect/Predicate";
import { type Adapter, Lucia } from "lucia";
import uncrypto from "uncrypto";
import { DatabaseResource } from "~/config/database";
import { SessionProvider } from "~/layers/session-provider";
import { sessionUser } from "~/migrations/tables/session-table";
import { userTable } from "~/migrations/tables/user-table";

// polyfill stable crypto global
Object.defineProperty(globalThis, "crypto", { value: uncrypto });

export function createLuciaProvider<TAdapter extends Adapter>(
  adapter: TAdapter,
  environment: "local" | "production" | (string & {}),
) {
  const lucia = new Lucia(adapter, {
    sessionCookie: {
      attributes: {
        // set to `true` when using HTTPS
        secure: environment === "production",
      },
    },

    getUserAttributes: (attributes) => {
      return {
        email: attributes.email,
        role: attributes.role,
        username:attributes.username,
        phone:attributes.phone
      };
    },
  });

  function createSession(user_id: string) {
    return pipe(
      Effect.tryPromise(() => lucia.createSession(user_id, {})),
      Effect.map((session) => ({
        session_id: session.id,
        expires_at: session.expiresAt,
      })),
    );
  }

  function validateSession(session_id: string) {
    return pipe(
      Effect.tryPromise(() => lucia.validateSession(session_id)),
      Effect.flatMap(({ session, user }) => {
        return isNullable(session) && isNullable(user)
          ? Effect.fail(new NoSuchElementException("Error validating session"))
          : Effect.succeed({ session, user });
      }),
    );
  }

  function invalidateSession(session_id: string) {
    return Effect.promise(() => lucia.invalidateSession(session_id));
  }

  function invalidateUserSessions(user_id: string) {
    return Effect.promise(() => lucia.invalidateUserSessions(user_id));
  }

  return {
    invalidateSession,
    validateSession,
    invalidateUserSessions,
    createSession,
    lucia,
  };
}

export const LuciaSessionProvider = Layer.suspend(() => {
  const getSessionProvider = Effect.gen(function* (_) {
    const env = yield* Config.string("APP_ENV");
    const client = yield* DatabaseResource;

    const dbAdapter = new DrizzlePostgreSQLAdapter(
      client.client,
      sessionUser,
      userTable,
    );

    const buildLucia = yield* Effect.try(() =>
      createLuciaProvider(dbAdapter, env),
    );

    return Layer.succeed(SessionProvider, buildLucia);
  });

  return Layer.unwrapEffect(getSessionProvider);
});

declare module "lucia" {
  interface Register {
    DatabaseSessionAttributes: DatabaseSessionAttributes;
    DatabaseUserAttributes: DatabaseUserAttributes;
  }
  type DatabaseSessionAttributes = Record<string, never>;
  interface DatabaseUserAttributes {
    email: string;
    role: string;
    username:string,
    phone:string
  }
}
