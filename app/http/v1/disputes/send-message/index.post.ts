import { Effect } from "effect";
import { sendDisputeMessageSchema } from "~/dto/dispute.dto";
import { validateBody } from "~/libs/request.helpers";
import { getSessionInfo } from "~/libs/session.helpers";
import { sendDisputeMessage } from "~/services/dispute.service";

export default eventHandler((event) => {
  const program = Effect.gen(function* (_) {
    const data = yield* validateBody(event, sendDisputeMessageSchema);
    const { user } = yield* getSessionInfo(event);

    return yield* sendDisputeMessage({
      currentUserId: user.id,
      message: data.message,
      disputeId: data.disputeId,
    });
  });

  return runLive(event, program);
});
