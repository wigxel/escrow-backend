import { Effect } from "effect";
import { hashPassword, verifyPassword } from "~/layers/encryption/helpers";
import { Argon2dHasherLive } from "~/layers/encryption/presets/argon2d";

describe("Argon2d PasswordHasher", () => {
  it("should pass for similar password", async () => {
    const passwordChanged = Effect.runPromise(
      Effect.provide(
        hashPassword("some_user_password").pipe(
          Effect.flatMap((e) => verifyPassword("some_user_password", e)),
        ),
        Argon2dHasherLive,
      ),
    );

    expect(passwordChanged).resolves.toMatchInlineSnapshot(
      `"Password verification successful"`,
    );
  });

  it.fails("should not pass for wrong password", async () => {
    await Effect.runPromise(
      Effect.provide(
        hashPassword("some_user_password").pipe(
          Effect.flatMap((e) => verifyPassword("some_User_password", e)),
        ),
        Argon2dHasherLive,
      ),
    );
  });
});
