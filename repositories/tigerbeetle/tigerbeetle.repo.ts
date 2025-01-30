import { Config, Context, Effect, Layer, pipe } from "effect";
import type { UnknownException } from "effect/Cause";
import type { AccountID, TransferID } from "tigerbeetle-node";
import { TigerBeetleAdapter } from "~/utils/tigerBeetle/tigerbeetle";
import type { TTBAccount, TTBTransfer } from "~/utils/tigerBeetle/type/type";

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

  lookupAccounts(accountIds: AccountID[]) {
    return this.run((client) => {
      return client.lookupAccounts(accountIds);
    });
  }

  lookupTransfers(transferIds: TransferID[]) {
    return this.run((client) => {
      return client.lookupTransfers(transferIds);
    });
  }
}

export class TigerBeetleRepo extends Context.Tag("TigerBeetleRepo")<
  TigerBeetleRepo,
  TigerBeetleRepository
>() {}

export const TigerBeetleRepoLayer = {
  Tag: TigerBeetleRepo,
  Repo: {
    Live: Layer.effect(
      TigerBeetleRepo,
      pipe(
        Config.string("TB_ADDRESS"),
        Effect.map(
          (addr) =>
            new TigerBeetleRepository(TigerBeetleAdapter.getInstance(addr)),
        ),
      ),
    ),
  },
};
