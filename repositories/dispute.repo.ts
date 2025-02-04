import { eq } from "drizzle-orm";
import { Context, Layer } from "effect";
import { allColumns, runDrizzleQuery } from "~/libs/query.helpers";
import { disputeMembersTable, disputeTable } from "~/migrations/schema";
import { DrizzleRepo } from "~/services/repository/RepoHelper";

export class DisputeRepository extends DrizzleRepo(disputeTable, "id") {
  getByUserId(params: { currentUserId: string }) {
    return runDrizzleQuery((db) => {
      return db
        .select(allColumns(disputeTable))
        .from(disputeTable)
        .leftJoin(
          disputeMembersTable,
          eq(disputeTable.id, disputeMembersTable.disputeId),
        )
        .where(eq(disputeMembersTable.userId, params.currentUserId));
    });
  }
}

export class DisputeRepo extends Context.Tag("DisputeRepo")<
  DisputeRepo,
  DisputeRepository
>() {}

export const DisputeRepoLayer = {
  Tag: DisputeRepo,
  Repo: {
    Live: Layer.succeed(DisputeRepo, new DisputeRepository()),
  },
};
