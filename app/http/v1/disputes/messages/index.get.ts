import { Effect } from "effect";
import { disputeIdSchema } from "~/dto/dispute.dto";
import { validateQuery } from "~/libs/request.helpers";
import { getSessionInfo } from "~/libs/session.helpers";
import {
  getDisputeMessages,
  updateDisputeStatus,
} from "~/services/dispute.service";
import { PaginationImpl } from "~/services/search/pagination.service";

export default eventHandler((event) => {
  const searchParams = getQuery(event);
  const program = Effect.gen(function* (_) {
    const data = yield* validateQuery(event, disputeIdSchema);
    const { user } = yield* getSessionInfo(event);

    return yield* getDisputeMessages({
      currentUser: user,
      disputeId: data.disputeId,
    });
  });

  return runLive(event, Effect.provide(program, PaginationImpl(searchParams)));
});
