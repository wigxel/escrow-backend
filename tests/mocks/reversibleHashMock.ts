import { Context, Effect, Layer } from "effect";
import type { ReversibleHashInterface } from "../../layers/encryption/reversible";

export class ReversibleHash extends Context.Tag("ReversibleHash")<
  ReversibleHash,
  ReversibleHashInterface
>() {}

export const ReversibleHashTestLive = Layer.succeed(ReversibleHash, {
  encrypt() {
    return Effect.succeed("");
  },
  decrypt() {
    return Effect.succeed("");
  },
});
