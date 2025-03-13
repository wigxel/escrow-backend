import { Config, Effect, pipe } from "effect";
import { OAuth2Client } from "oslo/oauth2";
import { z } from "zod";
import { ExpectedError } from "~/config/exceptions";
import { UserRepo } from "~/repositories/user.repository";
import { defineAppHandler } from "~/utils/effect";
import { Session } from "~/layers/session";
import { dataResponse } from "~/libs/response";
import { validateQuery } from "~/libs/request.helpers";

/**
 * Schema for validating Google OAuth callback parameters
 */
const googleAuthSchema = z.object({
  code: z.string().min(1, "Authorization code is required"),
  /**
   * The state parameter is critical for security in OAuth flows.
   * It prevents CSRF attacks by verifying that the authorization
   * response corresponds to a request initiated by this app.
   */
  state: z.string().min(1, "State parameter is required"),
});

export type GoogleAuthParams = z.infer<typeof googleAuthSchema>;

export type GoogleUserData = {
  sub: string;
  name: string;
  given_name?: string;
  family_name?: string;
  email: string;
  picture: string;
};

export default defineAppHandler((event) => {
  return Effect.gen(function* (_) {
    // Validate query parameters using Zod schema
    const params = yield* validateQuery(event, googleAuthSchema);

    // Authenticate with Google using validated parameters
    const user = yield* authenticateWithGoogle(params);

    // Create user session
    const session = yield* Session;
    const { session_id, expires_at } = yield* session.create(user.id);

    return dataResponse({
      message: "Google authentication successful",
      data: {
        access_token: session_id,
        expires: expires_at.toISOString(),
      },
    });
  });
});

const authenticateWithGoogle = (params: GoogleAuthParams) => {
  return Effect.gen(function* (_) {
    const serverUrl = yield* Config.string("SERVER_URL");
    const clientId = yield* Config.string("GOOGLE_CLIENT_ID");
    const clientSecret = yield* Config.string("GOOGLE_CLIENT_SECRET");

    // Google openid configuration
    const client = new OAuth2Client(
      clientId,
      "https://accounts.google.com/o/oauth2/v2/auth", // authorizeEndpoint
      "https://oauth2.googleapis.com/token", // tokenEndpoint
      {
        redirectURI: `${serverUrl}/api/v1/auth/signup/google`,
      },
    );

    const tokenResult = yield* Effect.tryPromise({
      try: () =>
        client.validateAuthorizationCode(params.code, {
          credentials: clientSecret,
          authenticateWith: "http_basic_auth",
        }),
      catch: (error) =>
        new ExpectedError(
          `Failed to validate authorization code: ${resolveError(error).message}`,
        ),
    });

    const userData = yield* getUserDataFromGoogle(tokenResult.access_token);
    return yield* findOrCreateUser(userData);
  });
};

const getUserDataFromGoogle = (accessToken: string) => {
  return Effect.tryPromise({
    try: async (): Promise<GoogleUserData> => {
      const response = await fetch(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch user data: ${response.statusText}`);
      }

      return await response.json();
    },
    catch: (error) =>
      new ExpectedError(
        `Failed to fetch user data: ${resolveError(error).message}`,
      ),
  });
};

const findOrCreateUser = (userData: GoogleUserData) => {
  return Effect.gen(function* (_) {
    const userRepo = yield* UserRepo;

    const createUser = pipe(
      userRepo.create({
        email: userData.email,
        firstName: userData.given_name || userData.name.split(" ")[0],
        lastName: userData.family_name || userData.name.split(" ")[1] || "",
        password: "",
        phone: "",
        emailVerified: true, // Users who use Google sign-in have verified email automatically
      }),
      Effect.head,
    );

    // Check if user already exists and return the user
    return yield* userRepo
      .firstOrThrow({ email: userData.email })
      .pipe(Effect.catchTag("NoSuchElementException", () => createUser));
  });
};
