import { Effect, Layer } from "effect";
import {
  TigerBeetleRepo,
  TigerBeetleRepository,
} from "~/repositories/tigerbeetle/tigerbeetle.repo";
import type { TigerBeetleAdapter } from "~/utils/tigerBeetle/tigerbeetle";

class mock extends TigerBeetleRepository {
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
    return Effect.succeed([]);
  }

  lookupTransfers() {
    return Effect.succeed([]);
  }
}

export const TigerBeetleRepoTestLive = Layer.succeed(
  TigerBeetleRepo,
  new mock(),
);
