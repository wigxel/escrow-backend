import "dotenv/config";
import {
  Config,
  ConfigProvider,
  Console,
  Effect,
  Exit,
  Layer,
  LogLevel,
  Logger,
} from "effect";
import { capitalize, toLowerCase } from "effect/String";
import { DatabaseConnection, DatabaseResource } from "~/config/database";
import { Argon2dHasherLive } from "~/layers/encryption/presets/argon2d";
import { runSeed as seedUserLocation } from "~/migrations/seeds/address.seed";
import { runSeed as seedCartItems } from "~/migrations/seeds/cartItems.seed";
import { runSeed as seedCategory } from "~/migrations/seeds/category.seed";
import { runSeed as seedOrder } from "~/migrations/seeds/order.seeder";
import { runSeed as seedProduct } from "~/migrations/seeds/product.seeder";
import { runSeed as seedReview } from "~/migrations/seeds/review.seed";
import { runSeed as seedUser } from "~/migrations/seeds/user.seed";
import { CartRepoLayer } from "~/repositories/cart.repository";
import { CartItemsRepoLayer } from "~/repositories/cartItems.repository";
import { CategoryRepoLive } from "~/repositories/category.repo";
import { CommentRepoLive } from "~/repositories/comment.repository";
import { NotificationRepoLayer } from "~/repositories/notification.repo";
import { OrderRepoLayer } from "~/repositories/order.repository";
import { OrderItemsRepoLayer } from "~/repositories/orderItems.repository";
import { PaymentRepoLayer } from "~/repositories/payment.repository";
import { ProductRepoLayer } from "~/repositories/product.repository";
import { ReviewRepoLive } from "~/repositories/review.repository";
import { UserRepoLayer } from "~/repositories/user.repository";
import { UserLocationRepoLayer } from "~/repositories/userLocation.repo";

const minimumLogLevel = Config.string("LOG_LEVEL").pipe(
  Effect.map((level) => {
    const formatted_level = capitalize(
      toLowerCase(String(level)),
    ) as LogLevel.Literal;
    return Logger.minimumLogLevel(LogLevel.fromLiteral(formatted_level));
  }),
  Effect.tapError(() => Console.error("Invalid LOG_LEVEL provided")),
  Layer.unwrapEffect,
);

const dependencies = Layer.empty.pipe(
  Layer.provideMerge(Argon2dHasherLive),
  Layer.provideMerge(UserRepoLayer.Repo.Live),
  Layer.provideMerge(CategoryRepoLive),
  Layer.provideMerge(ProductRepoLayer.Repo.Live),
  Layer.provideMerge(CartItemsRepoLayer.Repo.Live),
  Layer.provideMerge(CartRepoLayer.Repo.Live),
  Layer.provideMerge(OrderRepoLayer.Repo.Live),
  Layer.provideMerge(OrderItemsRepoLayer.Repo.Live),
  Layer.provideMerge(PaymentRepoLayer.Repo.Live),
  Layer.provideMerge(NotificationRepoLayer.Repo.Live),
  Layer.provideMerge(UserLocationRepoLayer.Repo.Live),
  Layer.provideMerge(ReviewRepoLive),
  Layer.provideMerge(CommentRepoLive),
  Layer.provideMerge(minimumLogLevel),
  Layer.provideMerge(Layer.setConfigProvider(ConfigProvider.fromEnv())),
);

function runSeeds<T extends Iterable<Effect.Effect<unknown, unknown, unknown>>>(
  seeds: T,
) {
  return Effect.gen(function* (_) {
    const { client } = yield* DatabaseResource;

    return yield* Effect.tryPromise(async () => {
      await client.transaction(async (tx) => {
        const TxModelDatabase = Layer.succeed(DatabaseConnection, tx);
        const runSeeds = Effect.all(seeds, { concurrency: 1 });

        await Effect.runPromise(
          // @ts-expect-error
          Effect.scoped(
            Effect.provide(
              // @ts-expect-error
              runSeeds,
              dependencies.pipe(Layer.provideMerge(TxModelDatabase)),
            ).pipe(Effect.tapError(Effect.logError)),
          ),
        );
      });
    });
  }).pipe(
    Effect.tap(() => Console.log("Seeding complete")),
    Effect.tapError((err) =>
      Console.error(`Seeding failed. Rolled back. \nError: ${err.toString()}`),
    ),
  );
}

const program = runSeeds([
  seedCategory,
  seedUser,
  seedProduct,
  seedReview,
  seedCartItems,
  seedOrder,
  seedUserLocation,
]);

const scopedEffect = Effect.scoped(Effect.provide(program, dependencies));

Effect.runPromiseExit(scopedEffect).then((exit) => {
  exit.pipe(
    Exit.match({
      onSuccess: () => process.exit(0),
      onFailure: () => process.exit(1),
    }),
  );
});
