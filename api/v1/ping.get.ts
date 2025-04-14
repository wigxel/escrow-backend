import { Effect } from "effect";
import { organizationAccountId } from "~/config/environment";
import { getAccount } from "~/services/tigerbeetle.service";

export default eventHandler(async (event) => {
  const tigerbeetle_status = Effect.gen(function* () {
    const org_account_id = yield* organizationAccountId;
    yield* getAccount(org_account_id);

    return { service: "ledger", status: "ok" };
  });

  return runLive(
    event,
    Effect.all([
      Effect.succeed({ service: "backend", status: "ok" }),
      tigerbeetle_status,
    ]),
  );
});
