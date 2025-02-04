import { Effect } from "effect";
import { DisputeRepo } from "~/repositories/dispute.repo";

export default eventHandler((event) => {
  const { id } = getRouterParams(event);

  const program = Effect.gen(function* (_) {
    const dispute = yield* DisputeRepo;
    return yield* _(dispute.firstOrThrow("escrowId", id));
  });

  return runLive(event, program);
});
