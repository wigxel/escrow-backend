import { Effect } from "effect";
import { NoSuchElementException } from "effect/Cause";
import { ExpectedError } from "~/config/exceptions";
import { TigerBeetleRepoLayer } from "~/repositories/tigerbeetle/tigerbeetle.repo";
import type { TTBAccount, TTBTransfer } from "~/layers/ledger/type";
import {
  handleCreateAccountErrors,
  handleCreateTransferErrors,
} from "~/layers/ledger/utils";

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
      Effect.mapError((e) => new ExpectedError(`error occurred ${e.cause}`)),
    );
    yield* handleCreateTransferErrors(errors);
  });
};

export const getAccount = (accountId: string) => {
  return Effect.gen(function* (_) {
    const tigerBeetleRepo = yield* _(TigerBeetleRepoLayer.Tag);
    const [account] = yield* tigerBeetleRepo.lookupAccounts(accountId);

    if (!account) {
      yield* new NoSuchElementException(
        `Tigerbeetle Account(${accountId}) missing`,
      );
    }

    return account;
  });
};

export const getAccountBalance = (accountId: string) => {
  return Effect.gen(function* (_) {
    const account = yield* getAccount(accountId);

    return (
      account.credits_posted - account.debits_posted - account.debits_pending
    );
  });
};
