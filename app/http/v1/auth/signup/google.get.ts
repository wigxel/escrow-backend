import { Config, Effect, Layer, pipe } from "effect";
import { OAuth2Client } from "oslo/oauth2";
import { DatabaseLive } from "~/layers/database";
import { UserRepo, UserRepoLayer } from "~/repositories/user.repository";

export default eventHandler(async (event) => {
  const { code, state } = getQuery(event);
  console.log(code, state);

  const program = pipe(
    validateAuth(code as string, state as string),
    Effect.map((user) => {
      const { password, ...newUser } = user;
      return {
        message: "User created successfully",
        data: newUser,
      };
    }),
  );

  return Effect.runPromise(
    Effect.scoped(Effect.provide(program, Dependencies)),
  );
});

const Dependencies = Layer.empty.pipe(
  Layer.provideMerge(UserRepoLayer.Repo.Live),
  Layer.provideMerge(DatabaseLive),
);

const validateAuth = (code: string, state: string) => {
  return Effect.gen(function* () {
    const serverUrl = yield* Config.string("APP_URL");
    const clientId = yield* Config.string("GOOGLE_CLIENT_ID");
    const clientSecret = yield* Config.string("GOOGLE_CLIENT_SECRET");

    // Google openid configuration - https://accounts.google.com/.well-known/openid-configuration
    const authorizeEndpoint = "https://accounts.google.com/o/oauth2/v2/auth";
    const tokenEndpoint = "https://oauth2.googleapis.com/token";

    const client = new OAuth2Client(
      clientId,
      authorizeEndpoint,
      tokenEndpoint,
      {
        redirectURI: `${serverUrl}/api/v1/auth/signup/google`,
      },
    );

    const tokenResponse = Effect.tryPromise(() =>
      client.validateAuthorizationCode(code, {
        credentials: clientSecret,
        authenticateWith: "http_basic_auth",
      }),
    );

    // Signup without error means no issues
    // TASK: Code fails at this point
    const { access_token } = yield* tokenResponse;

    const userData = yield* Effect.tryPromise(() => getUserData(access_token));

    const userRepo = yield* UserRepo;
    const [user] = yield* userRepo.create({
      email: userData.email,
      firstName: userData.name.split(" ")[0],
      lastName: userData.name.split(" ")[1],
      password: "",
      phone: "",
    });

    return user;
  });
};

const getUserData = async (access_token: string) => {
  const response = await fetch(
    `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${access_token}`,
  );

  const data = await response.json();
  return {
    googleId: data.sub,
    name: data.name,
    email: data.email,
    picture: data.picture, // Users who use google signin have verified email automatically,
  };
};
