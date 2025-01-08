import { Effect, Layer, pipe } from "effect";
import { Argon2id } from "oslo/password";
import { PasswordHasher, PasswordHasherError } from "~/layers/encryption";

export const Argon2dPasswordHasher = {
  name: "Argon2d",
  hash: hashPassword,
  verify: verifyPassword,
};

export const Argon2dHasherLive = Layer.succeed(
  PasswordHasher,
  Argon2dPasswordHasher,
);

function hashPassword(password: string) {
  return Effect.promise(() => new Argon2id().hash(password));
}

function verifyPassword(password: string, hash: string) {
  return pipe(
    Effect.tryPromise({
      try: () => new Argon2id().verify(hash, password),
      catch: (err) => new PasswordHasherError(err.toString()),
    }),
    Effect.map((status) => status),
  );
}
