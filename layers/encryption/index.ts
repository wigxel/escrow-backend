import { Context, type Effect } from "effect";
import { TaggedError } from "effect/Micro";

interface PasswordHasherInterface {
  readonly name: string;
  hash(value: string): Effect.Effect<string>;
  verify(
    password: string,
    hash: string,
  ): Effect.Effect<boolean, PasswordHasherError>;
}

export class PasswordHasher extends Context.Tag("PasswordHasher")<
  PasswordHasher,
  PasswordHasherInterface
>() {}

export class PasswordHasherError extends TaggedError("PasswordHasherError") {
  constructor(public message: string) {
    super();
  }
}
