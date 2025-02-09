import { eq } from "drizzle-orm";
import { Context, Effect, Layer } from "effect";
import { notNil, runDrizzleQuery } from "~/libs/query.helpers";
import { escrowTransactionTable } from "~/migrations/schema";
import { DrizzleRepo } from "~/services/repository/RepoHelper";

export class EscrowTransactionRepository extends DrizzleRepo(
  escrowTransactionTable,
  "id",
) {
  getEscrowDetails(escrowId: string) {
    return runDrizzleQuery((db) => {
      return db.query.escrowTransactionTable.findFirst({
        where: eq(escrowTransactionTable.id, escrowId),
        with: {
          paymentDetails: true,
          participants: true,
          escrowWalletDetails: true,
          activityLog:true
        },
      });
    }).pipe(Effect.flatMap(notNil));
  }
}

export class EscrowTransactionRepo extends Context.Tag("EscrowTransactionRepo")<
  EscrowTransactionRepo,
  EscrowTransactionRepository
>() {}

export const EscrowTransactionRepoLayer = {
  tag: EscrowTransactionRepo,
  live: Layer.succeed(EscrowTransactionRepo, new EscrowTransactionRepository()),
};
