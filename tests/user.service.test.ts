import { Effect, Layer } from "effect";
import {
  createUser,
  passwordReset,
  requestEmailVerificationOtp,
  verifyUserEmail,
} from "~/services/user.service";
import { AppTest, runTest } from "~/tests/mocks/app";
import { readOTP } from "~/tests/mocks/otp";
import { extendUserRepoMock } from "./mocks/user";

describe("Account verification", () => {
  it("should fail if otp is incorrect", async () => {
    const program = Effect.scoped(
      Effect.provide(
        verifyUserEmail("300023"), // <-- incorrect code
        AppTest,
      ),
    );

    const verify_user = await runTest(program);
    expect(verify_user).toMatchInlineSnapshot(`[ExpectedError: Invalid OTP]`);
  });

  it("should verify OTP is valid", async () => {
    const program = Effect.scoped(
      Effect.provide(
        readOTP.pipe(Effect.flatMap((code) => verifyUserEmail(code))),
        AppTest,
      ),
    );

    const verify_user = await runTest(program);

    expect(verify_user).toMatchInlineSnapshot(`
      {
        "message": "Email verified",
        "success": true,
      }
    `);
  });

  describe("Resend verification email", () => {
    it("should fail if user doesn't exist", async () => {
      const program = Effect.scoped(
        Effect.provide(
          requestEmailVerificationOtp("MOCK_INCORRECT_EMAIL", "verify"),
          AppTest,
        ),
      );
      const session = await runTest(program);
      expect(session).toMatchInlineSnapshot(
        `[ExpectedError: User with email doesn't exist]`,
      );
    });

    it("should fail if email is already verified", async () => {
      const program = Effect.scoped(
        Effect.provide(
          requestEmailVerificationOtp("johndoe@example.com", "verify"),
          AppTest,
        ),
      );
      const session = await runTest(program);
      expect(session).toMatchInlineSnapshot(
        `[ExpectedError: Email already verified]`,
      );
    });
    it("should succeed if user exists and email isn't verified", async () => {
      const program = Effect.scoped(
        Effect.provide(
          requestEmailVerificationOtp("user1@example.com", "verify"),
          AppTest,
        ),
      );
      const session = await runTest(program);
      expect(session).toMatchObject(
        expect.objectContaining({
          success: true,
          message: "OTP has been sent to email",
        }),
      );
    });
  });
});

describe("Create user", () => {
  it("should create user", async () => {
    const userData = {
      address: "Test address",
      country: "Ghana",
      email: "johndoe@gmail.com",
      firstName: "john",
      lastName: "doe",
      password: "pass123",
      phone: "0922348923",
      state: "Rivers",
    };

    const program = Effect.scoped(
      Effect.provide(createUser(userData), AppTest),
    );

    const response = await Effect.runPromise(program);

    expect(Object.keys(response.session)).toMatchObject([
      "session_id",
      "expires_at",
    ]);
    expect(response.user).toMatchObject(userData);
  });

  it("should fail if email or password already exist", async () => {
    const UserRepoTest = extendUserRepoMock({
      count() {
        return Effect.succeed(1);
      },
    });
    const userData = {
      address: "Test address",
      country: "Ghana",
      email: "johndoe@gmail.com",
      firstName: "john",
      lastName: "doe",
      password: "pass123",
      phone: "0922348923",
      state: "Rivers",
    };

    const program = Effect.scoped(
      Effect.provide(createUser(userData), UserRepoTest),
    );

    const response = await runTest(program);

    expect(response).toMatchInlineSnapshot(
      `[ExpectedError: Account already exists. Email or phone number is taken]`,
    );
  });
});

describe("Password reset", () => {
  describe("Request", () => {
    test("user can create request for a password reset", async () => {
      const program = Effect.scoped(
        Effect.provide(
          readOTP.pipe(
            Effect.flatMap((code) =>
              passwordReset({ otp: code, password: "" }),
            ),
          ),
          AppTest,
        ),
      );

      const session = await runTest(program);
      expect(session).toMatchInlineSnapshot(`
        {
          "message": "Password updated",
          "success": true,
        }
      `);
    });

    it("should fail if user doesn't exist", async () => {
      const MockUserRepo = extendUserRepoMock({
        update() {
          return Effect.fail(new Error("Update fail!"));
        },
      });

      const program = Effect.scoped(
        Effect.provide(
          readOTP.pipe(
            Effect.flatMap((code) =>
              passwordReset({ otp: code, password: "" }),
            ),
          ),
          MockUserRepo.pipe(Layer.provideMerge(AppTest)),
        ),
      );

      const session = await runTest(program);

      expect(session).toMatchInlineSnapshot(`[ExpectedError: Invalid user]`);
    });
  });

  describe("verification and password change", () => {
    it("should fail when password reset OTP is INVALID", async () => {
      const program = Effect.scoped(
        Effect.provide(
          passwordReset({ otp: "MOCK_FAKE_OTP", password: "" }),
          AppTest,
        ),
      );
      const response = await runTest(program);
      expect(response).toMatchInlineSnapshot(`[ExpectedError: Invalid OTP]`);
    });

    test("user can reset password with valid OTP", async () => {
      const program = Effect.scoped(
        Effect.provide(
          readOTP.pipe(
            Effect.flatMap((code) =>
              passwordReset({ otp: code, password: "" }),
            ),
          ),
          AppTest,
        ),
      );

      const session = await runTest(program);
      expect(session).toMatchInlineSnapshot(`
            {
              "message": "Password updated",
              "success": true,
            }
          `);
    });
  });
});
