import { Effect } from "effect";
import { ExpectedError } from "~/config/exceptions";
import { TigerBeetleRepoLayer } from "~/repositories/tigerbeetle/tigerbeetle.repo";
import type { TTBAccount, TTBTransfer } from "~/utils/tigerBeetle/type/type";
import {
  handleCreateAccountErrors,
  handleCreateTransferErrors,
} from "~/utils/tigerBeetle/utils";

export const createAccount = (params: TTBAccount) => {
  return Effect.gen(function* (_) {
    const tigerBeetleRepo = yield* _(TigerBeetleRepoLayer.Tag);
    const errors = yield* _(tigerBeetleRepo.createAccounts(params));
    yield* handleCreateAccountErrors(errors);
  });
};

export const createTransfer = (transfer: TTBTransfer) => {
  return Effect.gen(function* (_) {
    const tigerBeetleRepo = yield* _(TigerBeetleRepoLayer.Tag);
    const errors = yield* _(
      tigerBeetleRepo.createTransfers(transfer),
      Effect.mapError((e) => new ExpectedError(e.message)),
    );
    yield* handleCreateTransferErrors(errors);
  });
};
