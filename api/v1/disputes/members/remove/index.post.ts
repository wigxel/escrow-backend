import { Effect } from "effect";
import { disputeInviteSchema } from "../../../../../dto/dispute.dto";
import { validateBody } from "../../../../../libs/request.helpers";
import { getSessionInfo } from "../../../../../libs/session.helpers";
import { removeMember } from "../../../../../services/dispute/dispute.service";

export default eventHandler((event) => {
  const program = Effect.gen(function* (_) {
    const data = yield* validateBody(event, disputeInviteSchema);
    const { user } = yield* getSessionInfo(event);

    return yield* removeMember({
      currentUser: user,
      disputeId: data.disputeId,
      userId: data.userId,
    });
  });

  return runLive(event, program);
});
