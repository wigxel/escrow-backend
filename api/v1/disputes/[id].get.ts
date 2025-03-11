import { Effect } from "effect";
import { ExpectedError } from "~/config/exceptions";
import { dataResponse } from "~/libs/response";
import { DisputeRepo } from "~/repositories/dispute.repo";

export default eventHandler((event) => {
  const { id } = getRouterParams(event);

  const program = Effect.gen(function* (_) {
    const dispute = yield* DisputeRepo;
    const details = yield* _(
      dispute.firstOrThrow("escrowId", id),
      Effect.mapError(() => new ExpectedError("Invalid dispute id")),
    );

    return dataResponse({ data: details });
  });

  return runLive(event, program);
});
