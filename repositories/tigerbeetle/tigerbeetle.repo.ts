import { Config, Context, Effect, Layer, pipe } from "effect";
import type { UnknownException } from "effect/Cause";
import {
  type Client,
  type Account,
  type Transfer,
  type AccountID,
  type TransferID,
  createClient,
} from "tigerbeetle-node";

export class TigerBeetleRepository {
  private client: Client;

  constructor(address: string | number, clusterId = 0n) {
    this.client = createClient({
      cluster_id: clusterId,
      replica_addresses: [address || "3000"],
    });
  }
  run<T>(
    fn: (client: Client) => Promise<T>,
  ): Effect.Effect<T, UnknownException> {
    return Effect.tryPromise(() => fn(this.client));
  }

  createAccounts(account: Account[]) {
    return this.run((client) => {
      return client.createAccounts(account);
    });
  }

  createTransfers(transfer: Transfer[]) {
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
        Effect.map((addr) => new TigerBeetleRepository(addr)),
      ),
    ),
  },
};
