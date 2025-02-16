import { Effect } from "effect";
import { z } from "zod";
import { validateParams } from "~/libs/request.helpers";
import { getSessionInfo } from "~/libs/session.helpers";
import { deleteBankAcounts } from "~/services/bank.service";

export default eventHandler(async (event) => {
  const bankAccountId = getRouterParam(event, "accountId");
  const program = Effect.gen(function* (_) {
    yield* validateParams(
      z.object({ bankAccountId: z.string().uuid() }),
      { bankAccountId },
    );
    const {user} = yield* getSessionInfo(event);
    yield* deleteBankAcounts({bankAccountId,currentUser:user});

    return {
      status: "success",
      message: "Bank account deleted successfully",
    }
  });
  return runLive(event, program);
});
