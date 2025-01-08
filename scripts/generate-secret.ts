import "dotenv/config";
import { Effect, Exit } from "effect";
import { HMAC } from "oslo/crypto";
import { arrayBufferToBase64 } from "~/services/otp/otp.util";

const generateSecretHash = Effect.gen(function* (_) {
  const secret = new HMAC("SHA-1");

  return yield* Effect.tryPromise(() => secret.generateKey()).pipe(
    Effect.map((e) => arrayBufferToBase64(e)),
  );
});

Effect.runPromiseExit(generateSecretHash).then(
  Exit.match({
    onSuccess: console.info,
    onFailure: console.error,
  }),
);
