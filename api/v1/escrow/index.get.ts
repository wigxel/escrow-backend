import { Effect } from "effect";
import type { z } from "zod";
import { escrowTransactionFilterDto } from "~/dto/escrowTransactions.dto";
import { validateQuery } from "~/libs/request.helpers";
import { getSessionInfo } from "~/libs/session.helpers";
import { getUsersEscrowTransactions } from "~/services/escrow/escrowTransactionServices";
import { PaginationImpl } from "~/services/search/pagination.service";

export default eventHandler((event) => {
	let params:z.infer<typeof escrowTransactionFilterDto>;
	const program = Effect.gen(function* (_) {
		params = yield* validateQuery(event, escrowTransactionFilterDto);
		const { user } = yield* getSessionInfo(event);
		return yield* getUsersEscrowTransactions(params,user);
	});

	return runLive(event, Effect.provide(program, PaginationImpl(params)));
});
