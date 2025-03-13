import { fromUnixTime, getUnixTime, isPast } from "date-fns";
import { Config, Context, Effect, type Record, Redacted } from "effect";
import { z } from "zod";
import { createReversibleHash } from "../layers/encryption/presets/reversible-hasher";
import { ReversibleHash } from "./encryption/reversible";
import type { EmailTokenImplementation } from "./mailing/hashing";

export class EmailToken extends Context.Tag("EmailToken")<
  EmailToken,
  EmailTokenImplementation
>() {}

export function createTimeBasedEncryption(
  data: Record<string, unknown>,
  expires_at: Date,
) {
  const encryptData = Effect.gen(function* () {
    const cipher = yield* ReversibleHash;

    const content = JSON.stringify({
      data,
      expires_at: getUnixTime(expires_at),
    });

    return yield* cipher.encrypt(content);
  });

  return Effect.gen(function* (_) {
    const SALT = yield* Config.redacted("MAILING_SALT");
    const IV_HEX = yield* Config.redacted("MAILING_HEX");

    const hashing_service = createReversibleHash({
      salt: Redacted.value(SALT),
      hex: Redacted.value(IV_HEX),
    });

    return yield* Effect.provide(encryptData, hashing_service);
  });
}

export function decryptTimeBasedEncryption(encrypted_string: string) {
  const decrypt = Effect.gen(function* () {
    const decipher = yield* ReversibleHash;
    const value = yield* decipher.decrypt(encrypted_string);

    return value;
  });

  return Effect.gen(function* (_) {
    const SALT = yield* Config.redacted("MAILING_SALT");
    const IV_HEX = yield* Config.redacted("MAILING_HEX");

    const hashing_service = createReversibleHash({
      salt: Redacted.value(SALT),
      hex: Redacted.value(IV_HEX),
    });

    const value = yield* Effect.provide(decrypt, hashing_service);

    const data = yield* Effect.try({
      try() {
        const d = JSON.parse(value) as unknown as Record<string, unknown>;
        return TokenData.parse(d);
      },
      catch() {
        return new Error("Error deserializing encrypted data");
      },
    });

    if ("expires_at" in data) {
      if (!isPast(fromUnixTime(data.expires_at))) {
        return data.data;
      }
    }

    return yield* Effect.fail(new Error("Token expired"));
  });
}

const TokenData = z.object({
  data: z.any(),
  expires_at: z.number({ coerce: true }),
});
