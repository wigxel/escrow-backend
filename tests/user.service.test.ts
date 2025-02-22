import { Effect, Layer } from "effect";
import {
  checkUsername,
  createUser,
  passwordReset,
  verifyUserEmail,
} from "~/services/user.service";
import { AppTest, runTest } from "~/tests/mocks/app";
import { extendOtpRepo } from "~/tests/mocks/otp";
import { extendUserRepoMock } from "./mocks/user/user";
import { notNil } from "~/libs/query.helpers";
import { extendReferralSourceRepo } from "./mocks/referralSourceRepoMock";
import { extendUserWalletRepo } from "./mocks/user/userWalletMock";
import { extendTigerBeetleRepo } from "./mocks/tigerBeetleRepoMock";
import { extendNotificationFacade } from "./mocks/notification/notificationFacadeMock";

describe("User services", () => {
  describe("check username", () => {
    test("should fail if username is taken", () => {
      const program = checkUsername("kd");
      const result = runTest(program);
      expect(result).resolves.toMatchInlineSnapshot(
        `[ExpectedError: Username taken]`,
      );
    });

    test("shouldn't fail if username is available", async () => {
      const userRepo = extendUserRepoMock({
        firstOrThrow() {
          return Effect.succeed(undefined).pipe(Effect.flatMap(notNil));
        },
      });

      const program = checkUsername("kd");
      const result = await runTest(Effect.provide(program, userRepo));
      expect(result).toMatchInlineSnapshot(`
        {
          "data": null,
          "message": "Username is available",
          "status": "success",
        }
      `);
    });
  });

  describe("Create user", () => {
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

    test("should fail if username is taken", async () => {
      const program = createUser(userData);
      const result = runTest(program);
      expect(result).resolves.toMatchInlineSnapshot(
        `[ExpectedError: Username taken]`,
      );
    });

    test("should fail for invalid referral source id", () => {
      const userRepo = extendUserRepoMock({
        firstOrThrow() {
          return Effect.succeed(undefined).pipe(Effect.flatMap(notNil));
        },
      });

      const referralSourceRepo = extendReferralSourceRepo({
        firstOrThrow() {
          return Effect.succeed(undefined).pipe(Effect.flatMap(notNil));
        },
      });

      const program = createUser(userData);
      const result = runTest(
        Effect.provide(program, Layer.merge(userRepo, referralSourceRepo)),
      );
      expect(result).resolves.toMatchInlineSnapshot(
        `[ExpectedError: invalid referral source ID]`,
      );
    });

    test("should fail if email or phone already exist", async () => {
      const userRepo = extendUserRepoMock({
        firstOrThrow() {
          return Effect.succeed(undefined).pipe(Effect.flatMap(notNil));
        },
        count() {
          return Effect.succeed(1);
        },
      });

      const program = createUser(userData);
      const result = runTest(Effect.provide(program, userRepo));
      expect(result).resolves.toMatchInlineSnapshot(
        `[ExpectedError: Account already exists. Email or phone number is taken]`,
      );
    });

    test("create the user account", async () => {
      let userCreated = false;
      let userWalletCreated = false;
      let tigerbeetleAccountCreated = false;
      let otpCreated = false;
      let isNnotified = false;

      const userRepo = extendUserRepoMock({
        firstOrThrow() {
          userCreated = true;
          return Effect.succeed(undefined).pipe(Effect.flatMap(notNil));
        },
      });

      const userWalletRepo = extendUserWalletRepo({
        create() {
          userWalletCreated = true;
          return Effect.succeed([]);
        },
      });

      const tigerBeetleRepo = extendTigerBeetleRepo({
        createAccounts() {
          tigerbeetleAccountCreated = true;
          return Effect.succeed([]);
        },
      });

      const otpRepo = extendOtpRepo({
        create() {
          otpCreated = true;
          return Effect.succeed([
            {
              id: "",
              userId: "user-id",
              email: "user-email",
              kind: "",
              otpReason: "EMAIL_VERIFICATION",
              value: "233233",
            },
          ]);
        },
      });

      const notifyMock = extendNotificationFacade({
        notify() {
          isNnotified = true;
          return Effect.succeed(1);
        },
      });

      const program = createUser(userData);
      const result = await runTest(
        Effect.provide(
          program,
          userRepo.pipe(
            Layer.provideMerge(userWalletRepo),
            Layer.provideMerge(tigerBeetleRepo),
            Layer.provideMerge(otpRepo),
            Layer.provideMerge(notifyMock),
          ),
        ),
      );
      expect(userCreated).toBeTruthy();
      expect(userWalletCreated).toBeTruthy();
      expect(tigerbeetleAccountCreated).toBeTruthy();
      expect(otpCreated).toBeTruthy();
      expect(isNnotified).toBeTruthy();
      expect(result).toMatchInlineSnapshot(`
        {
          "data": {
            "session_data": {
              "expires_at": 2025-03-21T23:00:00.000Z,
              "session_id": "session-id",
            },
          },
          "message": "user created successfully",
          "status": "success",
        }
      `);
    });
  });

  describe.skip("Account verification", () => {
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

    describe.skip("Resend verification email", () => {
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

  describe.skip("Password reset", () => {
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

    describe.skip("verification and password change", () => {
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
});
