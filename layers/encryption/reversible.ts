import { Context, type Effect } from "effect";
import { TaggedError } from "effect/Data";

export interface ReversibleHashInterface {
  encrypt(content: string): Effect.Effect<string, HashingError>;
  decrypt(content: string): Effect.Effect<string, HashingError>;
}

/**
 * For encrypting and decrypting public content.
 * I created this for email tokens specifically
 */
export class ReversibleHash extends Context.Tag("ReversibleHash")<
  ReversibleHash,
  ReversibleHashInterface
>() {}

export class HashingError extends TaggedError("HashingError") {
  constructor(public message: string) {
    super();
  }
}
