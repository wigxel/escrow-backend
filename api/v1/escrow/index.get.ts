import { Effect } from "effect";
import { escrowTransactionFilterDto } from "../../../dto/escrowTransactions.dto";
import { validateQuery } from "../../../libs/request.helpers";
import { getSessionInfo } from "../../../libs/session.helpers";
import { listUserEscrowTransactions } from "../../../services/escrow/escrowTransactionServices";
import { SearchServiceLive } from "../../../services/search/pagination.service";

export default defineAppHandler((event) => {
  return Effect.gen(function* (_) {
    const params = yield* validateQuery(event, escrowTransactionFilterDto);
    const { user } = yield* getSessionInfo(event);

    return yield* _(
      listUserEscrowTransactions(params, user.id).pipe(
        Effect.provide(SearchServiceLive(getQuery(event))),
      ),
    );
  });
});
