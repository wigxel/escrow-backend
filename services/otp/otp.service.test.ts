import { ConfigProvider, Effect, Layer } from "effect";
import { readOTPSecret } from "~/services/otp/otp.service";

const config = Layer.setConfigProvider(
  ConfigProvider.fromJson({
    OTP_SECRET: "hellom",
  }),
);

it("secret should be cached", () => {
  const fn = Effect.gen(function* (_) {
    const secret = yield* readOTPSecret;
    const secret2 = yield* readOTPSecret;
    const secret3 = yield* readOTPSecret;

    return [secret, secret2, secret3];
  });

  const [a, b] = Effect.runSync(Effect.provide(fn, config));

  expect(a).toStrictEqual(b);
});
