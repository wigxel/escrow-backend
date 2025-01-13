import { Config, Effect } from "effect";
import { OAuth2Client, generateState } from "oslo/oauth2";

export default eventHandler(async (event) => {
  const program = createGoogleAuthURL();
  const res = program.pipe(
    Effect.match({
      onSuccess: (url) => ({
        success: true,
        message: "Generated google authorization url",
        data: url,
      }),
      onFailure: () => ({
        success: false,
        message: "Couldn't generate google authorization url",
      }),
    }),
  );

  return Effect.runPromise(res);
});

const createGoogleAuthURL = () => {
  return Effect.gen(function* () {
    const serverUrl = yield* Config.string("SERVER_URL");
    const clientId = yield* Config.string("GOOGLE_CLIENT_ID");

    const state = generateState();
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

    const urlEffect = Effect.tryPromise(() =>
      client.createAuthorizationURL({
        state,
        scopes: ["email profile openid"],
      }),
    );

    const url = yield* urlEffect;

    return url.toString();
  });
};
