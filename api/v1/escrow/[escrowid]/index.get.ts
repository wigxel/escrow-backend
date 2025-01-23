import { Effect } from "effect";
import { z } from "zod";
import { validateParams } from "~/libs/request.helpers";
import { getSessionInfo } from "~/libs/session.helpers";
import {

  getEscrowTransactionDetails,
} from "~/services/transaction/escrowTransactionServices";

export default eventHandler(async (event) => {
  const escrowId = getRouterParam(event, "escrowid");
  const program = Effect.gen(function* (_) {
    yield* validateParams(
      z.object({ escrowId: z.string().uuid() }),
      { escrowId },
    );
    yield* getSessionInfo(event);
    return yield* getEscrowTransactionDetails({ escrowId });
  });
  return runLive(event, program);
});
