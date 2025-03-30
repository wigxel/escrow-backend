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
import { runSeed as seedUser } from "~/migrations/seeds/user.seed";
import { runSeed as seedDisputeCategories } from "~/migrations/seeds/disputeCategory.seed";
import { runSeed as seedDisputeResolution } from "~/migrations/seeds/disputeResolution.seed";
import { runSeed as seedReferralSource } from "~/migrations/seeds/referralSource.seed";
import { UserRepoLayer } from "~/repositories/user.repository";
import { DisputeCategorysRepoLayer } from "~/repositories/disputeCategories.repo";
import { DisputeResolutionssRepoLayer } from "~/repositories/disputeResolution.repo";
import { ReferralSourcesRepoLayer } from "~/repositories/referralSource.repo";
import { AppLive } from "~/config/app";
import { seedAddress } from "../seeds/address.seed";
import { seedBankAccount } from "../seeds/bankAccount.seed";
import { seedEscrow } from "../seeds/escrow.seed";
import { seedReview } from "../seeds/review.seed";
import { seedOrgAccount } from "../seeds/orgAccount.seed";

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
  Layer.provideMerge(DisputeCategorysRepoLayer.Repo.Live),
  Layer.provideMerge(DisputeResolutionssRepoLayer.Repo.Live),
  Layer.provideMerge(ReferralSourcesRepoLayer.Repo.Live),
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
              dependencies.pipe(
                Layer.provideMerge(TxModelDatabase),
                Layer.provideMerge(AppLive),
              ),
            ).pipe(Effect.tapError(Effect.logError)),
          ),
        );
      });
    });
  }).pipe(
    Effect.tap(() => Console.log("Seeding complete")),
    Effect.tapError((err) =>
      Console.error(
        `Seeding failed. Rolled back. \nError: ${err.toString()}, ${err.cause}`,
      ),
    ),
  );
}

const program = runSeeds([
  seedOrgAccount,
  seedUser,
  seedDisputeCategories,
  seedDisputeResolution,
  seedReferralSource,
  seedAddress,
  seedBankAccount,
  seedEscrow,
  seedReview,
]);

const scopedEffect = Effect.scoped(Effect.provide(program, AppLive));

Effect.runPromiseExit(scopedEffect).then((exit) => {
  exit.pipe(
    Exit.match({
      onSuccess: () => process.exit(0),
      onFailure: () => process.exit(1),
    }),
  );
});
