import { ConfigProvider, Effect, Layer, type Scope } from "effect";
import { Argon2dHasherLive } from "~/layers/encryption/presets/argon2d";
import type { InferRequirements } from "~/services/effect.util";
import { DatabaseTest } from "~/tests/mocks/database";
import { NotificationRepoTest } from "~/tests/mocks/notification/notificationRepoMock";
import { OTPRepoTest } from "~/tests/mocks/otp";
import { SessionProviderTest } from "~/tests/mocks/authentication/session-provider";
import { UserRepoTest } from "~/tests/mocks/user/user";
import { DisputeMemberRepoTest } from "./dispute/disputeMembersRepo";
import { DisputeRepoTest } from "./dispute/disputeRepoMock";
import { ReviewTest } from "./review";
import { SesssionTest } from "./authentication/session";
import { resolveErrorResponse } from "~/libs/response";
import { EscrowParticipantRepoTest } from "./escrow/escrowParticipantsRepoMock";
import { EscrowTransactionRepoTest } from "./escrow/escrowTransactionRepoMock";
import { DisputeCategoryRepoTest } from "./dispute/disputeCategoryMock";
import { DisputeResolutionRepoTest } from "./dispute/disputeResolutionMock";
import { NotificationFacadeTestLive } from "./notification/notificationFacadeMock";
import { ActivityLogRepoTest } from "./activityLogRepoMock";
import { FileStorageTestLive } from "./filestorageMock";
import { ChatServiceTestLive } from "./chatServiceMock";
import { Mailer } from "~/layers/mailing";
import type { SendMailParams } from "~/layers/mailing/types";
import { PaginationImpl } from "~/services/search/pagination.service";
import { UserWalletRepoTest } from "./user/userWalletMock";
import { ReversibleHashTestLive } from "./reversibleHashMock";
import { ReferralSourceRepoTest } from "./referralSourceRepoMock";
import { TigerBeetleRepoTestLive } from "./tigerBeetleRepoMock";

const ReviewModuleTest = Layer.empty.pipe(Layer.provideMerge(ReviewTest));

const mailService = {
  send(params: SendMailParams) {
    return Effect.succeed(undefined);
  },
};
const MailServiceTest = Layer.succeed(Mailer, mailService);

const EscrowModuleTest = Layer.empty.pipe(
  Layer.provideMerge(EscrowTransactionRepoTest),
  Layer.provideMerge(EscrowParticipantRepoTest),
);

const DisputeModuleTest = Layer.empty.pipe(
  Layer.provideMerge(DisputeRepoTest),
  Layer.provideMerge(DisputeMemberRepoTest),
  Layer.provideMerge(DisputeCategoryRepoTest),
  Layer.provideMerge(DisputeResolutionRepoTest),
);

const NotificationModuleTest = Layer.empty.pipe(
  Layer.provideMerge(NotificationRepoTest),
  Layer.provideMerge(NotificationFacadeTestLive),
);

const AuthModuleTest = Layer.empty.pipe(
  Layer.provideMerge(OTPRepoTest),
  Layer.provideMerge(SesssionTest),
  Layer.provideMerge(SessionProviderTest),
  Layer.provideMerge(Argon2dHasherLive),
);

const UserModuleTest = Layer.empty.pipe(
  Layer.provideMerge(UserRepoTest),
  Layer.provideMerge(UserWalletRepoTest),

)

export const AppTest = Layer.empty.pipe(
  Layer.provideMerge(DatabaseTest),
  Layer.provideMerge(AuthModuleTest),
  Layer.provideMerge(UserModuleTest),
  Layer.provideMerge(ReviewModuleTest),
  Layer.provideMerge(DisputeModuleTest),
  Layer.provideMerge(EscrowModuleTest),
  Layer.provideMerge(NotificationModuleTest),
  Layer.provideMerge(ActivityLogRepoTest),
  Layer.provideMerge(FileStorageTestLive),
  Layer.provideMerge(ChatServiceTestLive),
  Layer.provideMerge(MailServiceTest),
  Layer.provideMerge(ReversibleHashTestLive),
  Layer.provideMerge(ReferralSourceRepoTest),
  Layer.provideMerge(TigerBeetleRepoTestLive),
  Layer.provideMerge(PaginationImpl({ page: "1" })),
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
        SALT_HEX: "salt_hex",
        IV_HEX: "iv_hex",
        ORG_ACCOUNT_ID: "11111111111111",
        TB_ADDRESS: "1010",
        PSK_PUBLIC_KEY: "",
        FIREBASE_CONFIG: "",
        MAILING_HEX: "",
        MAILING_SALT: "",
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
