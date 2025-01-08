import { Effect } from "effect";
import { disputeStatusUpdateSchema } from "~/dto/dispute.dto";
import { validateBody } from "~/libs/request.helpers";
import { getSessionInfo } from "~/libs/session.helpers";
import { updateDisputeStatus } from "~/services/dispute.service";

export default eventHandler((event) => {
  const program = Effect.gen(function* (_) {
    const data = yield* validateBody(event, disputeStatusUpdateSchema);
    const { user } = yield* getSessionInfo(event);

    return yield* updateDisputeStatus({
      currentUser: user,
      status: data.status,
      disputeId: data.disputeId,
    });
  });

  return runLive(event, program);
});
