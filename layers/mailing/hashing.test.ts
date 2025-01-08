import { addDays } from "date-fns";
import { ConfigProvider, Effect, Layer } from "effect";
import { createTimeBasedEncryption } from "../email-token";

it("should add reversible time-based token", () => {
  const SALT = "hello";
  const IV_HEX = "c28d1b0086ac1d7c82d57ac22d5abbaf";

  const token = Effect.runSync(
    Effect.provide(
      createTimeBasedEncryption(
        { name: "Frank moore" },
        addDays(new Date(2024, 5, 26), 30),
      ),
      Layer.setConfigProvider(
        ConfigProvider.fromJson({
          MAILING_SALT: SALT,
          MAILING_HEX: IV_HEX,
        }),
      ),
    ),
  );

  // Usage as a token for email links
  // `https://localhost:3000/customer/events?userId=12&token=${token}`
  //
  expect(typeof token === "string").toBe(true);
});
