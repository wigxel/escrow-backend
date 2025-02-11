import { Effect } from "effect";
import { newDisputeSchema } from "~/dto/dispute.dto";
import { validateBody } from "~/libs/request.helpers";
import { getSessionInfo } from "~/libs/session.helpers";
import { createDispute } from "~/services/dispute/dispute.service";

export default eventHandler((event) => {
  const program = Effect.gen(function* (_) {
    const data = yield* validateBody(event, newDisputeSchema);
    const { user } = yield* getSessionInfo(event);

    const dispute = yield* createDispute({
      currentUser: user,
      disputeData: {
        escrowId: data.escrowId,
        reason: data.reason,
      },
    });

    return {disputeId: dispute.id };
  });

  return runLive(event, program);
});
