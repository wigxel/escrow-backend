import { count, eq } from "drizzle-orm";
import { Context, Effect, Layer } from "effect";
import { head } from "effect/Array";
import { runDrizzleQuery } from "~/libs/query.helpers";
import { type TDisputeMessage, disputeMessageTable } from "~/migrations/schema";
import { DrizzleRepo } from "~/services/repository/RepoHelper";

export class DisputeMessageRepository extends DrizzleRepo(
  disputeMessageTable,
  "id",
) {
  messageCount(params?: TDisputeMessage) {
    return runDrizzleQuery((db) => {
      return db
        .select({ count: count() })
        .from(disputeMessageTable)
        .where(eq(disputeMessageTable.disputeId, params.disputeId));
    }).pipe(
      Effect.flatMap(head),
      Effect.map((v) => v.count),
    );
  }
}

export class DisputeMessageRepo extends Context.Tag("DisputeMessageRepo")<
  DisputeMessageRepo,
  DisputeMessageRepository
>() {}

export const DisputeMessagesRepoLayer = {
  Tag: DisputeMessageRepo,
  Repo: {
    Live: Layer.succeed(DisputeMessageRepo, new DisputeMessageRepository()),
  },
};
