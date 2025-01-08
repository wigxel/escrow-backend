import { ConfigProvider, Effect, Layer, type Scope } from "effect";
import { Argon2dHasherLive } from "~/layers/encryption/presets/argon2d";
import { Mailer } from "~/layers/mailing";
import { MailLive } from "~/layers/mailing/mail";
import { NotificationLive } from "~/layers/notification/layer";
import { resolveErrorResponse } from "~/libs/response";
import type { InferRequirements } from "~/services/effect.util";
import { FakeMaker } from "~/services/mailing/faker-mailer";
import { PaginationImpl } from "~/services/search/pagination.service";
import { ChatServiceTest } from "~/tests/mocks/chatServiceMock";
import { DatabaseTest } from "~/tests/mocks/database";
import { NotificationRepoTest } from "~/tests/mocks/notificationRepoMock";
import { OTPRepoTest } from "~/tests/mocks/otp";
import { SessionProviderTest } from "~/tests/mocks/session-provider";
import { FileStorageTest } from "~/tests/mocks/storage";
import { UserRepoTest } from "~/tests/mocks/userRepoMock";
import { AuthUserTest } from "./auth";
import { CartItemRepoTest } from "./cartItemsRepoMock";
import { CartRepoTest } from "./cartRepoMock";
import { CategoryRepoTest } from "./categoryRepoMock";
import { CheckoutManagerServiceTest } from "./checkoutManagerServiceMock";
import { CommentTest } from "./comment";
import { DisputeMemberRepoTest } from "./disputeMembersRepo";
import { DisputeRepoTest } from "./disputeRepoMock";
import { DeliveryDetailsRepoTest } from "./order-shipping-repo-mock";
import { OrderCancellationRepoTest } from "./orderCancellationRepoMock";
import { OrderItemsRepoTest } from "./orderItemsRepoMock";
import { OrderRepoTest } from "./orderRepoMock";
import { OrderStatusHistoryRepoTest } from "./orderStatusHistoryMock";
import { PaymentOrderRepoTest } from "./paymentOrderRepoMock";
import { PaymentRepoTest } from "./paymentRepoMock";
import { ProductImageRepoTest } from "./productImageRepoMock";
import { ProductRepoTest } from "./productRepoMock";
import { ReviewTest } from "./review";
import { SesssionTest } from "./session";
import { UserLocationRepoTest } from "./userLocationRepoMock";

const ReviewModuleTest = Layer.empty.pipe(
  Layer.provideMerge(ReviewTest),
  Layer.provideMerge(CommentTest),
);

const NotificationServiceTest = Layer.empty.pipe(
  Layer.provideMerge(NotificationRepoTest),
);

const AuthModuleTest = Layer.empty.pipe(
  Layer.provideMerge(OTPRepoTest),
  Layer.provideMerge(AuthUserTest),
  Layer.provideMerge(UserRepoTest),
  Layer.provideMerge(SesssionTest),
  Layer.provideMerge(SessionProviderTest),
  Layer.provideMerge(Argon2dHasherLive),
);

const ProductModuleTest = Layer.empty.pipe(
  Layer.provideMerge(ProductRepoTest),
  Layer.provideMerge(ProductImageRepoTest),
  Layer.provideMerge(CategoryRepoTest),
);

const OrderModuleTest = Layer.empty.pipe(
  Layer.provideMerge(OrderRepoTest),
  Layer.provideMerge(OrderItemsRepoTest),
  Layer.provideMerge(OrderStatusHistoryRepoTest),
  Layer.provideMerge(OrderCancellationRepoTest),
  Layer.provideMerge(DeliveryDetailsRepoTest),
);

export const MailingService = Layer.empty.pipe(
  Layer.provideMerge(NotificationLive),
  Layer.provideMerge(MailLive),
  Layer.provideMerge(Layer.succeed(Mailer, new FakeMaker())),
);

export const StorageModule = Layer.empty.pipe(
  Layer.provideMerge(FileStorageTest),
);

export const AppTest = Layer.empty.pipe(
  Layer.provideMerge(DatabaseTest),
  Layer.provideMerge(ReviewModuleTest),
  Layer.provideMerge(AuthModuleTest),
  Layer.provideMerge(ProductModuleTest),
  Layer.provideMerge(CartRepoTest),
  Layer.provideMerge(CartItemRepoTest),
  Layer.provideMerge(DisputeRepoTest),
  Layer.provideMerge(StorageModule),
  Layer.provideMerge(DisputeMemberRepoTest),
  Layer.provideMerge(ChatServiceTest),
  Layer.provideMerge(PaymentRepoTest),
  Layer.provideMerge(OrderModuleTest),
  Layer.provideMerge(PaymentOrderRepoTest),
  Layer.provideMerge(UserLocationRepoTest),
  Layer.provideMerge(CheckoutManagerServiceTest),
  Layer.provideMerge(NotificationServiceTest),
  Layer.provideMerge(MailingService),
  Layer.provideMerge(PaginationImpl({ page: "1" })),
  Layer.provideMerge(
    Layer.setConfigProvider(
      ConfigProvider.fromJson({
        DB_URL: "some_database_url",
        MAIL_HOST: "somemailhost",
        MAIL_PORT: 1111,
        MAIL_USERNAME: "somemailuser",
        MAIL_PASSWORD: "somemailpassword",
        MAIL_FROM: "from@testapp.com",
        APP_ENV: "local",
        APP_NAME: "TheYardBazaarTest",
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
