import { and, eq } from "drizzle-orm";
import { Context, Effect, Layer } from "effect";
import { notNil, runDrizzleQuery } from "~/libs/query.helpers";
import {
  disputeReadReceiptTable,
  type TDisputeReadReceipt,
} from "~/migrations/schema";
import { DrizzleRepo } from "~/services/repository/RepoHelper";

export class DisputeReadReceiptRepository extends DrizzleRepo(
  disputeReadReceiptTable,
  "disputeId",
) {
  getReadReceipts(data: TDisputeReadReceipt) {
    return runDrizzleQuery((db) => {
      return db.query.disputeReadReceiptTable.findFirst({
        where: and(
          eq(disputeReadReceiptTable.disputeId, data.disputeId),
          eq(disputeReadReceiptTable.userId, data.userId),
        ),
      });
    }).pipe(Effect.flatMap(notNil));
  }

  updateReadReceipt(
    disputeId: string,
    currentUserId: string,
    data: TDisputeReadReceipt,
  ) {
    return runDrizzleQuery((db) => {
      return db
        .update(disputeReadReceiptTable)
        .set(data)
        .where(
          and(
            eq(disputeReadReceiptTable.disputeId, disputeId),
            eq(disputeReadReceiptTable.userId, currentUserId),
          ),
        )
        .returning();
    });
  }
}

export class DisputeReadReceiptRepo extends Context.Tag(
  "DisputeReadReceiptRepo",
)<DisputeReadReceiptRepo, DisputeReadReceiptRepository>() {}

export const DisputeReadReceiptRepoLayer = {
  Tag: DisputeReadReceiptRepo,
  Repo: {
    Live: Layer.succeed(
      DisputeReadReceiptRepo,
      new DisputeReadReceiptRepository(),
    ),
  },
};
