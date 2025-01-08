import { Effect, Either, pipe } from "effect";
import { PasswordHasher, PasswordHasherError } from "~/layers/encryption/index";

export function hashPassword(value: string) {
  return pipe(
    PasswordHasher,
    Effect.flatMap((e) => e.hash(value)),
  );
}

export function verifyPassword(password: string, hash: string) {
  return pipe(
    PasswordHasher,
    Effect.flatMap((e) => e.verify(password, hash)),
    Effect.flatMap((e) =>
      e === true
        ? Effect.succeed("Password verification successful")
        : Effect.fail(new PasswordHasherError("Password verification failed")),
    ),
  );
}
