import { and, count, eq } from "drizzle-orm";
import { Context, Effect, Layer } from "effect";
import { head } from "effect/Array";
import type { TEscrowTransactionFilter } from "~/dto/escrowTransactions.dto";
import { notNil, runDrizzleQuery } from "~/libs/query.helpers";
import { escrowTransactionTable } from "~/migrations/schema";
import { DrizzleRepo } from "~/services/repository/RepoHelper";

export class EscrowTransactionRepository extends DrizzleRepo(
	escrowTransactionTable,
	"id",
) {
	escrowCount(filters: TEscrowTransactionFilter, userId: string) {
		return runDrizzleQuery((db) => {
			return db
				.select({ count: count() })
				.from(escrowTransactionTable)
				.where(
					and(
						...Object.entries(filters).map(([key, value]) => {
							if (key === "status")
								return eq(
									escrowTransactionTable.status,
									value as TEscrowTransactionFilter["status"],
								);
						}),
						eq(escrowTransactionTable.createdBy, userId),
					),
				);
		}).pipe(
			Effect.map((d) => d),
			Effect.flatMap(head),
		);
	}

	getEscrowTransactions(filters: TEscrowTransactionFilter, userId: string) {
		return runDrizzleQuery((db) => {
			return db.query.escrowTransactionTable.findMany({
				where: and(
					...Object.entries(filters).map(([key, value]) => {
						if (key === "status")
							return eq(
								escrowTransactionTable.status,
								value as TEscrowTransactionFilter["status"],
							);
					}),
					eq(escrowTransactionTable.createdBy, userId),
				),
				limit: filters.pageSize,
				offset: filters.pageSize * filters.pageNumber,
			});
		});
	}

	getEscrowDetails(escrowId: string) {
		return runDrizzleQuery((db) => {
			return db.query.escrowTransactionTable.findFirst({
				where: eq(escrowTransactionTable.id, escrowId),
				with: {
					paymentDetails: true,
					participants: true,
					escrowWalletDetails: true,
					activityLog: true,
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
