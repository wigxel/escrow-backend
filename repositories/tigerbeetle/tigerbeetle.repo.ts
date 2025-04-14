import { Context, Effect, Layer } from "effect";
import type { UnknownException } from "effect/Cause";
import { TigerBeetleResource } from "~/config/database";
import type { TigerBeetleAdapter } from "~/layers/ledger/tigerbeetle";
import type { TTBAccount, TTBTransfer } from "~/layers/ledger/type";

/** @todo: Rename to Ledger */
export class TigerBeetleRepository {
  constructor(private client: TigerBeetleAdapter) {
    this.client = client;
  }

  private run<T>(
    fn: (client: TigerBeetleAdapter) => Promise<T>,
  ): Effect.Effect<T, UnknownException> {
    return Effect.tryPromise(() => fn(this.client));
  }

  createAccounts(account: TTBAccount) {
    return this.run((client) => {
      return client.createAccounts(account);
    });
  }

  createTransfers(transfer: TTBTransfer) {
    return this.run((client) => {
      return client.createTransfers(transfer);
    });
  }

  lookupAccounts(accountIds: string | string[]) {
    return this.run((client) => {
      return client.lookupAccounts(accountIds);
    });
  }

  lookupTransfers(transferIds: string | string[]) {
    return this.run((client) => {
      return client.lookupTransfers(transferIds);
    });
  }
}

export class TigerBeetleRepo extends Context.Tag("TigerBeetleRepo")<
  TigerBeetleRepo,
  TigerBeetleRepository
>() {}

const TigerBeetleRepoLive = Layer.effect(
  TigerBeetleRepo,
  Effect.gen(function* () {
    const instance = yield* Effect.tryPromise({
      try: () => TigerBeetleResource,
      catch: () => new Error("Cant read TBInstance"),
    });

    return new TigerBeetleRepository(instance);
  }),
);

export const TigerBeetleRepoLayer = {
  Tag: TigerBeetleRepo,
  Repo: {
    Live: TigerBeetleRepoLive,
  },
};
