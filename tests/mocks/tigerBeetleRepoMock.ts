import { Effect, Layer } from "effect";
import {
  TigerBeetleRepo,
  TigerBeetleRepository,
} from "~/repositories/tigerbeetle/tigerbeetle.repo";
import type { TigerBeetleAdapter } from "~/layers/ledger/tigerbeetle";
import { extendMockImplementation } from "./helpers";
import type { Account } from "tigerbeetle-node";

class Mock extends TigerBeetleRepository {
  constructor() {
    super({} as TigerBeetleAdapter);
  }
  createAccounts() {
    return Effect.succeed([]);
  }

  createTransfers() {
    return Effect.succeed([]);
  }

  lookupAccounts() {
    return Effect.succeed([
      {
        id: BigInt(1111111),
        credits_pending: BigInt(0),
        credits_posted: BigInt(100000),
        debits_pending: BigInt(0),
        debits_posted: BigInt(0),
      },
    ] as Account[]);
  }

  lookupTransfers() {
    return Effect.succeed([]);
  }
}

export const TigerBeetleRepoTestLive = Layer.succeed(
  TigerBeetleRepo,
  new Mock(),
);

export const extendTigerBeetleRepo = extendMockImplementation(
  TigerBeetleRepo,
  () => new Mock(),
);
