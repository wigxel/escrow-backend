import { Effect, Layer } from "effect";
import {
  checkUsername,
  createUser,
  deleteUserPushToken,
  forgotPassword,
  getUserPushTokens,
  handleUserCreationFromEscrow,
  passwordReset,
  resendEmailVerificationOtp,
  UserBalance,
  verifyUserEmail,
} from "~/services/user.service";
import { runTest } from "~/tests/mocks/app";
import { extendOtpRepo } from "~/tests/mocks/otp";
import { extendUserRepoMock } from "./mocks/user/user";
import { notNil } from "~/libs/query.helpers";
import { extendReferralSourceRepo } from "./mocks/referralSourceRepoMock";
import { extendUserWalletRepo } from "./mocks/user/userWalletMock";
import { extendTigerBeetleRepo } from "./mocks/tigerBeetleRepoMock";
import { extendNotificationFacade } from "./mocks/notification/notificationFacadeMock";
import { extendEscrowParticipantRepo } from "./mocks/escrow/escrowParticipantsRepoMock";
import { Account } from "tigerbeetle-node";
import { extendPushTokenRepo } from "./mocks/user/pushTokenMock";

describe("User services", () => {
  const currentUser = {
    email: "",
    id: "",
    username: "",
    phone: "",
    role: "",
  };

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

  describe("Resend verification email", () => {
    const email = "email";
    test("should fail if user doesn't exist", () => {
      const userRepo = extendUserRepoMock({
        firstOrThrow() {
          return Effect.succeed(undefined).pipe(Effect.flatMap(notNil));
        },
      });

      const program = resendEmailVerificationOtp(email);
      const result = runTest(Effect.provide(program, userRepo));
      expect(result).resolves.toMatchInlineSnapshot(
        `[ExpectedError: User with email doesn't exist]`,
      );
    });

    test("should fail if email is already verified", async () => {
      const program = resendEmailVerificationOtp(email);
      const result = runTest(program);
      expect(result).resolves.toMatchInlineSnapshot(
        `[ExpectedError: Email already verified]`,
      );
    });

    test("should succeed if user exists and email isn't verified", async () => {
      let otpUpdated = false;
      let isNotified = false;
      const userRepo = extendUserRepoMock({
        firstOrThrow() {
          return Effect.succeed({
            id: "user-id",
            firstName: "test data",
            lastName: "test data",
            email: "user@gmail.com",
            password:
              "$argon2id$v=19$m=19456,t=2,p=1$mxVZvfCeexfpkfp15EnDWQ$gG7x/+N0sXxqt86kwUlYr6k08+m10g9ql1VL6aQX/aA",
            address: "test data",
            state: "test data",
            country: "test data",
            phone: "test data",
            role: "user",
            profilePicture: "test data",
            emailVerified: false,
            createdAt: new Date(2025, 2, 21),
            updatedAt: new Date(2025, 2, 21),
          });
        },
      });

      const otpRepo = extendOtpRepo({
        update() {
          otpUpdated = true;
          return Effect.succeed([]);
        },
      });

      const notifyMock = extendNotificationFacade({
        notify() {
          isNotified = true;
          return Effect.succeed(1);
        },
      });

      const program = resendEmailVerificationOtp(email);
      const result = await runTest(
        Effect.provide(
          program,
          userRepo.pipe(
            Layer.provideMerge(otpRepo),
            Layer.provideMerge(notifyMock),
          ),
        ),
      );
      expect(otpUpdated).toBeTruthy();
      expect(isNotified).toBeTruthy();
      expect(result).toMatchInlineSnapshot(`
        {
          "data": null,
          "message": "Email resend successful",
          "status": "success",
        }
      `);
    });
  });

  describe("User email verification", () => {
    const params = { otp: "123456", email: "email" };

    test("should fail if otp is incorrect", async () => {
      const otpRepo = extendOtpRepo({
        firstOrThrow() {
          return Effect.succeed(undefined).pipe(Effect.flatMap(notNil));
        },
      });

      const program = verifyUserEmail(params);
      const result = runTest(Effect.provide(program, otpRepo));
      expect(result).resolves.toMatchInlineSnapshot(
        `[ExpectedError: Invalid OTP]`,
      );
    });

    test("should verify OTP is valid", async () => {
      let userUpdated = false;
      let otpDeleted = false;
      const userRepo = extendUserRepoMock({
        update() {
          userUpdated = true;
          return Effect.succeed([]);
        },
      });

      const otpRepo = extendOtpRepo({
        delete() {
          otpDeleted = true;
          return Effect.succeed(true);
        },
      });

      const program = verifyUserEmail(params);
      const result = await runTest(
        Effect.provide(program, Layer.merge(userRepo, otpRepo)),
      );
      expect(userUpdated).toBeTruthy();
      expect(otpDeleted).toBeTruthy();
      expect(result).toMatchInlineSnapshot(`
        {
          "data": null,
          "message": "Email verification success",
          "status": "success",
        }
      `);
    });
  });

  describe("Forget password", () => {
    const email = "email";
    test("should fail if user doesn't exist", () => {
      const userRepo = extendUserRepoMock({
        firstOrThrow() {
          return Effect.succeed(undefined).pipe(Effect.flatMap(notNil));
        },
      });

      const program = forgotPassword(email);
      const result = runTest(Effect.provide(program, userRepo));
      expect(result).resolves.toMatchInlineSnapshot(
        `[ExpectedError: Request is being processed]`,
      );
    });

    test("should create new otp on if otp not present for user", async () => {
      let otpCreated = false;
      let isNotified = false;
      const otpRepo = extendOtpRepo({
        firstOrThrow() {
          return Effect.succeed(undefined).pipe(Effect.flatMap(notNil));
        },
        create() {
          otpCreated = true;
          return Effect.succeed([]);
        },
      });

      const notifyMock = extendNotificationFacade({
        notify() {
          isNotified = true;
          return Effect.succeed(1);
        },
      });

      const program = forgotPassword(email);
      const result = await runTest(
        Effect.provide(program, Layer.merge(otpRepo, notifyMock)),
      );

      expect(otpCreated).toBeTruthy();
      expect(isNotified).toBeTruthy();
      expect(result).toMatchInlineSnapshot(`
        {
          "data": null,
          "message": "Forget password successful",
          "status": "success",
        }
      `);
    });

    test("should update otp if otp already present for user", async () => {
      let otpUpdated = false;
      let isNotified = false;
      const otpRepo = extendOtpRepo({
        update() {
          otpUpdated = true;
          return Effect.succeed([]);
        },
      });

      const notifyMock = extendNotificationFacade({
        notify() {
          isNotified = true;
          return Effect.succeed(1);
        },
      });

      const program = forgotPassword(email);
      const result = await runTest(
        Effect.provide(program, Layer.merge(otpRepo, notifyMock)),
      );

      expect(otpUpdated).toBeTruthy();
      expect(isNotified).toBeTruthy();
      expect(result).toMatchInlineSnapshot(`
        {
          "data": null,
          "message": "Forget password successful",
          "status": "success",
        }
      `);
    });
  });

  describe("Password reset", () => {
    const params = {
      otp: "123456",
      password: "1234568",
      email: "email",
    };

    test("should fail if invalid otp", async () => {
      const otpRepo = extendOtpRepo({
        firstOrThrow() {
          return Effect.succeed(undefined).pipe(Effect.flatMap(notNil));
        },
      });

      const program = passwordReset(params);
      const result = runTest(Effect.provide(program, otpRepo));
      expect(result).resolves.toMatchInlineSnapshot(
        `[ExpectedError: Invalid OTP]`,
      );
    });

    test("should reset users password", async () => {
      let userUpdated = false;
      let otpDeleted = false;

      const userRepo = extendUserRepoMock({
        update() {
          userUpdated = true;
          return Effect.succeed([]);
        },
      });

      const otpRepo = extendOtpRepo({
        delete() {
          otpDeleted = true;
          return Effect.succeed([]);
        },
      });

      const program = passwordReset(params);
      const result = await runTest(
        Effect.provide(program, Layer.merge(userRepo, otpRepo)),
      );
      expect(userUpdated).toBeTruthy();
      expect(otpDeleted).toBeTruthy();
      expect(result).toMatchInlineSnapshot(`
        {
          "data": null,
          "message": "Password reset successful",
          "status": "success",
        }
      `);
    });
  });

  describe("Handle user creation from escrow", () => {
    const params = {
      escrowId: "MOCK_ESCROW_ID",
      customerEmail: "MOCK_EMAIL",
      customerPhone: 11222333,
      customerUsername: "MOCK_USERNAME",
    };
    test("should fail if email or phone already exists", () => {
      const userRepo = extendUserRepoMock({
        count() {
          return Effect.succeed(1);
        },
      });

      const program = handleUserCreationFromEscrow(params);
      const result = runTest(Effect.provide(program, userRepo));
      expect(result).resolves.toMatchInlineSnapshot(
        `[ExpectedError: Email is already taken]`,
      );
    });

    test("should create new account from escrow", async () => {
      let userCreated = false
      let isNotified = false
      const userRepo = extendUserRepoMock({
        //@ts-expect-error
        create() {
          userCreated = true
          return Effect.succeed([
            {
              firstName: "",
              lastName: "",
              password: "",
              email: params.customerEmail,
              phone: String(params.customerPhone),
              username: params.customerUsername,
            },
          ]);
        },
      });

      const notifyMock = extendNotificationFacade({
        notify(){
          isNotified = true
          return Effect.succeed(1)
        }
      })

      const program = handleUserCreationFromEscrow(params);
      const result = await runTest(Effect.provide(program, Layer.merge(userRepo,notifyMock)));
      expect(userCreated).toBeTruthy()
      expect(isNotified).toBeTruthy()
      expect(result).toMatchInlineSnapshot(`
        {
          "email": "MOCK_EMAIL",
          "firstName": "",
          "lastName": "",
          "password": "",
          "phone": "11222333",
          "username": "MOCK_USERNAME",
        }
      `);
    });
  });

  describe("User balance", () => {
    test("should fail if invalid user id", () => {
      const userWalletRepo = extendUserWalletRepo({
        firstOrThrow() {
          return Effect.fail(new Error("not found"));
        },
      });

      const program = UserBalance(currentUser);
      const result = runTest(Effect.provide(program, userWalletRepo));
      expect(result).resolves.toMatchInlineSnapshot(
        `[ExpectedError: Wallet not found]`,
      );
    });

    test("should calculate the users balance", () => {
      const escrowParticipants = extendEscrowParticipantRepo({
        getParticipantsWithWallet(userId) {
          return Effect.succeed([
            {
              id: "id",
              escrowId: "escrow-id",
              userId: "buyer-id",
              role: "seller",
              status: "active",
              walletDetails: {
                id: "wallet-id",
                escrowId: "escrow-id",
                createdAt: new Date(2025, 2, 22),
                updatedAt: new Date(2025, 2, 22),
                tigerbeetleAccountId: "1111111",
              },
            },
            {
              id: "id",
              escrowId: "escrow-id",
              userId: "buyer-id",
              role: "seller",
              status: "active",
              walletDetails: {
                id: "wallet-id",
                escrowId: "escrow-id",
                createdAt: new Date(2025, 2, 22),
                updatedAt: new Date(2025, 2, 22),
                tigerbeetleAccountId: "1111111",
              },
            },
          ]);
        },
      });

      const tigerBeetleRepo = extendTigerBeetleRepo({
        lookupAccounts() {
          return Effect.succeed([
            {
              id: BigInt(1111111),
              credits_pending: BigInt(0),
              credits_posted: BigInt(100000),
              debits_pending: BigInt(0),
              debits_posted: BigInt(0),
            },
          ] as Account[]);
        },
      });

      const program = UserBalance(currentUser);
      const result = runTest(
        Effect.provide(
          program,
          Layer.merge(escrowParticipants, tigerBeetleRepo),
        ),
      );
      expect(result).resolves.toMatchInlineSnapshot(`
        {
          "data": {
            "totalEscrowBalance": 2000,
            "walletBalance": 1000,
          },
          "status": "success",
        }
      `);
    });
  });

  describe("Get users push notification tokens or device id", () => {
    test("should fetch all user's push tokens or device id", async () => {
      const program = getUserPushTokens("user-id");
      const result = await runTest(program);
      expect(result).toMatchInlineSnapshot(`
        {
          "data": [
            {
              "createdAt": 2025-03-21T23:00:00.000Z,
              "id": 1,
              "token": "device-token",
              "updatedAt": 2025-03-21T23:00:00.000Z,
              "userId": "user-id",
            },
          ],
          "status": "success",
        }
      `);
    });
  });

  describe("Delete push tokens", () => {
    test("should delete users push tokens", async () => {
      let isDeleted = false;
      const pushTokenRepo = extendPushTokenRepo({
        delete() {
          isDeleted = true;
          return Effect.succeed(true);
        },
      });

      const program = deleteUserPushToken({ currentUser, token: "MOCK-TOKEN" });
      const result = await runTest(Effect.provide(program, pushTokenRepo));
      expect(isDeleted).toBeTruthy();
      expect(result).toMatchInlineSnapshot(`
        {
          "data": null,
          "message": "User device push token deleted",
          "status": "success",
        }
      `);
    });
  });
});
