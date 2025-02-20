import { ConfigProvider, Effect, Layer, type Scope } from "effect";
import { Argon2dHasherLive } from "~/layers/encryption/presets/argon2d";
import type { InferRequirements } from "~/services/effect.util";
import { DatabaseTest } from "~/tests/mocks/database";
import { NotificationRepoTest } from "~/tests/mocks/notificationRepoMock";
import { OTPRepoTest } from "~/tests/mocks/otp";
import { SessionProviderTest } from "~/tests/mocks/session-provider";
import { UserRepoTest } from "~/tests/mocks/user";
import { DisputeMemberRepoTest } from "./disputeMembersRepo";
import { DisputeRepoTest } from "./disputeRepoMock";
import { ReviewTest } from "./review";
import { SesssionTest } from "./session";
import { resolveErrorResponse } from "~/libs/response";

const ReviewModuleTest = Layer.empty.pipe(Layer.provideMerge(ReviewTest));

const NotificationServiceTest = Layer.empty.pipe(
  Layer.provideMerge(NotificationRepoTest),
);

const AuthModuleTest = Layer.empty.pipe(
  Layer.provideMerge(OTPRepoTest),
  Layer.provideMerge(UserRepoTest),
  Layer.provideMerge(SesssionTest),
  Layer.provideMerge(SessionProviderTest),
  Layer.provideMerge(Argon2dHasherLive),
);

export const AppTest = Layer.empty.pipe(
  Layer.provideMerge(DatabaseTest),
  Layer.provideMerge(ReviewModuleTest),
  Layer.provideMerge(AuthModuleTest),
  Layer.provideMerge(DisputeRepoTest),
  Layer.provideMerge(DisputeMemberRepoTest),
  Layer.provideMerge(NotificationServiceTest),
  Layer.provideMerge(
    Layer.setConfigProvider(
      ConfigProvider.fromJson({
        DB_URL: "some_database_url",
        MAIL_HOST: "somemailhost",
        MAIL_PORT: 1111,
        MAIL_USERNAME: "somemailuser",
        MAIL_PASSWORD: "somemailpassword",
        MAIL_FROM: "frommail",
        NODE_ENV: "nodenv",
        ENABLE_MAILING: false,
        OTP_SECRET:
          "khvezZbbF9PefeRNpNIbN2OzeY3sqQQmRcFweI3GbBGAI3ihdTx3xVTEXdUItSIgu4VQte94xKw5Shjxd0qEmg==",
        ENABLE_IMAGE_UPLOAD: false,
        CLOUDINARY_SECRET_KEY: "somecloudinarysecret",
        CLOUDINARY_API_KEY: "somecloudinaryapikey",
        CLOUDINARY_CLOUD_NAME: "somecloudinarycloudname",
        CLOUDINARY_FOLDER: "somecloudinaryfolder",
      }),
    ),
  ),
);

/**
 * Runs the Effect program with the `AppTest` as the Requirements and `NewModelDatabase` as Scope
 * @param effect {Effect.Effect}
 */
export const runTest = <
  A,
  E,
  R extends InferRequirements<typeof AppTest> | Scope.Scope,
>(
  effect: Effect.Effect<A, E, R>,
) => {
  const program = effect as Effect.Effect<
    A,
    E,
    InferRequirements<typeof AppTest>
  >;

  return Effect.runPromise(
    Effect.scoped(
      Effect.provide(
        program.pipe(
          Effect.tapError((reason) => Effect.logDebug("RequestError", reason)),
          Effect.match({
            onSuccess: (d) => d as A,
            onFailure: resolveErrorResponse,
          }),
        ),
        AppTest,
      ),
    ),
  );
};
