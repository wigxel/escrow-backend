import { Effect } from "effect";
import { z } from "zod";
import { validateBody } from "../../../libs/request.helpers";
import { getSessionInfo } from "../../../libs/session.helpers";
import { addNewBankAccount } from "../../../services/bank.service";

export default eventHandler(async (event) => {
  const program = Effect.gen(function* (_) {
    const data = yield* validateBody(
      event,
      z.object({ bankAccountToken: z.string().uuid() }),
    );
    const { user } = yield* getSessionInfo(event);

    yield* Effect.logDebug(`User: ${user.id}`);
    yield* addNewBankAccount(data.bankAccountToken, user);

    return {
      status: "success",
      message: "Bank account added successfully",
    };
  });

  return runLive(event, program);
});
