import type { TPaystackPaymentWebhookEvent } from "~/utils/paystack/type/types";
import { extendEscrowWalletRepo } from "./mocks/escrow/escrowWalletRepoMock";
import { Effect, Layer } from "effect";
import {
  handleSuccessPaymentEvents,
  releaseFunds,
  withdrawFromWallet,
} from "~/services/paystack/payment.service";
import { runTest } from "./mocks/app";
import { extendTigerBeetleRepo } from "./mocks/tigerBeetleRepoMock";
import { extendAccountStatementRepo } from "./mocks/accountStatementRepoMock";
import { extendNotificationFacade } from "./mocks/notification/notificationFacadeMock";
import { extendEscrowTransactionRepo } from "./mocks/escrow/escrowTransactionRepoMock";
import { extendUserWalletRepo } from "./mocks/user/userWalletMock";
import { extendActivityLogRepo } from "./mocks/activityLogRepoMock";
import { extendBankAccountRepo } from "./mocks/user/bankAccountMock";
import { extendPaymentGateway } from "./mocks/payment/paymentGatewayMock";
import { extendWithdrawalRepo } from "./mocks/withdrawalRepoMock";

describe("Payment service", () => {
  const currentUser = {
    id: "MOCK_USER_ID",
    email: "MOCK_EMAIL",
    username: "MOCK_USERNAME",
    phone: "1111111",
    role: "user",
  };
  describe("handle success payment events", () => {
    //@ts-expect-error
    const params = {
      data: {
        amount: 10000,
        reference: "ref_CODE",
        id: 1,
        channel: "card",
        metadata: {
          escrowId: "MOCK_ESCROW_ID",
          customerDetails: {
            userId: "MOCK_USER_ID",
            email: "email",
            username: "username",
          },
          relatedUserId: "user-id",
        },
      },
      event: "charge.success",
    } as TPaystackPaymentWebhookEvent;

    test("should fail if invalid escrow id on getting escrow wallet", () => {
      const escrowWalletRepo = extendEscrowWalletRepo({
        firstOrThrow() {
          return Effect.fail(new Error(""));
        },
      });

      const program = handleSuccessPaymentEvents(params);
      const result = runTest(Effect.provide(program, escrowWalletRepo));
      expect(result).resolves.toMatchInlineSnapshot(
        "[ExpectedError: Invalid escrow id: wallet not found]",
      );
    });

    test("should handle successful payment event", async () => {
      let createdTigerbeetleTransfer = false;
      let createdAccountStatement = false;
      let notifyCount = 0;

      const tigerBeetleRepo = extendTigerBeetleRepo({
        createTransfers() {
          createdTigerbeetleTransfer = true;
          return Effect.succeed([]);
        },
      });

      const accountStatementRepo = extendAccountStatementRepo({
        create() {
          createdAccountStatement = true;
          return Effect.succeed([]);
        },
      });

      const NotificationFacadeMock = extendNotificationFacade({
        notify() {
          notifyCount += 1;
          return Effect.succeed(1);
        },
      });

      const program = handleSuccessPaymentEvents(params);
      const result = await runTest(
        Effect.provide(
          program,
          tigerBeetleRepo.pipe(
            Layer.provideMerge(accountStatementRepo),
            Layer.provideMerge(NotificationFacadeMock),
          ),
        ),
      );
      expect(createdTigerbeetleTransfer).toBeTruthy();
      expect(createdAccountStatement).toBeTruthy();
      expect(notifyCount).toBe(2);
    });
  });

  describe("Release funds", () => {
    const params = {
      currentUser,
      escrowId: "MOCK_ESCROW_ID",
      releaseCode: "hKk-I1gWf4P-7rzGMt",
    };
    test("should fail if invalid escrow id", () => {
      const escrowRepo = extendEscrowTransactionRepo({
        //@ts-expect-error
        getEscrowDetails() {
          return Effect.fail(new Error(""));
        },
      });

      const program = releaseFunds(params);
      const result = runTest(Effect.provide(program, escrowRepo));
      expect(result).resolves.toMatchInlineSnapshot(
        "[NoSuchElementException: Invalid escrow transaction id]",
      );
    });

    test("should if invalid release code", () => {
      const escrowRepo = extendEscrowTransactionRepo({
        //@ts-expect-error
        getEscrowDetails() {
          return Effect.succeed({
            id: "test-id",
            status: "completed",
            title: "",
            description: "",
            createdBy: "",
            releaseCode:"$argon2id$v=19$m=19456,t=2,p=1$9GSSz5vugGBjZTY4t4XmmA$sKkQBR2TvVWcbFSfnZULHFjcrrCbRcK01VsxDS7TSKY,",
            createdAt: new Date(2025, 2, 20),
            updatedAt: new Date(2025, 2, 20),
            activitylog: [{}],
            paymentDetails: {},
            participants: [{}],
            escrowWalletDetails: {
              id: "test-id",
              escrowId: "escrow-id",
              tigerbeetleAccountId: "1111111",
              createdAt: new Date(2025, 2, 23),
              updatedAt: new Date(2025, 2, 23),
            },
          });
        },
      });

      const program = releaseFunds(params);
      const result = runTest(Effect.provide(program, escrowRepo));
      expect(result).resolves.toMatchInlineSnapshot(`[PermissionError: Invalid release code provided]`);
    });

    test("should fail if escrow status is completed", () => {
      const escrowRepo = extendEscrowTransactionRepo({
        //@ts-expect-error
        getEscrowDetails() {
          return Effect.succeed({
            id: "test-id",
            status: "completed",
            title: "",
            description: "",
            releaseCode:"$argon2id$v=19$m=19456,t=2,p=1$9GSSz5vugGBjZTY4t4XmmA$sKkQBR2TvVWcbFSfnZULHFjcrrCbRcK01VsxDS7TSKY",
            createdBy: "",
            createdAt: new Date(2025, 2, 20),
            updatedAt: new Date(2025, 2, 20),
            activitylog: [{}],
            paymentDetails: {},
            participants: [{}],
            escrowWalletDetails: {
              id: "test-id",
              escrowId: "escrow-id",
              tigerbeetleAccountId: "1111111",
              createdAt: new Date(2025, 2, 23),
              updatedAt: new Date(2025, 2, 23),
            },
          });
        },
      });

      const program = releaseFunds(params);
      const result = runTest(Effect.provide(program, escrowRepo));
      expect(result).resolves.toMatchInlineSnapshot(
        "[ExpectedError: This transaction has already been completed.]",
      );
    });

    test("should fail if cannot legally transition escrow status", () => {
      const program = releaseFunds(params);
      const result = runTest(program);
      expect(result).resolves.toMatchInlineSnapshot(
        "[ExpectedError: Cannot transition from created to completed]",
      );
    });

    test("should fail if recipient wallet not found", () => {
      const escrowRepo = extendEscrowTransactionRepo({
        //@ts-expect-error
        getEscrowDetails() {
          return Effect.succeed({
            id: "test-id",
            status: "deposit.success",
            title: "",
            description: "",
            createdBy: "",
            releaseCode:"$argon2id$v=19$m=19456,t=2,p=1$9GSSz5vugGBjZTY4t4XmmA$sKkQBR2TvVWcbFSfnZULHFjcrrCbRcK01VsxDS7TSKY",
            createdAt: new Date(2025, 2, 20),
            updatedAt: new Date(2025, 2, 20),
            activitylog: [{}],
            paymentDetails: {},
            participants: [{}],
            escrowWalletDetails: {
              id: "test-id",
              escrowId: "escrow-id",
              tigerbeetleAccountId: "1111111",
              createdAt: new Date(2025, 2, 23),
              updatedAt: new Date(2025, 2, 23),
            },
          });
        },
      });

      const userWalletRepo = extendUserWalletRepo({
        firstOrThrow() {
          return Effect.fail(new Error(""));
        },
      });

      const program = releaseFunds({
        ...params,
        currentUser: { ...params.currentUser, id: "buyer-id" },
      });
      const result = runTest(
        Effect.provide(program, Layer.merge(escrowRepo, userWalletRepo)),
      );
      expect(result).resolves.toMatchInlineSnapshot(
        "[NoSuchElementException: Invalid user id: user wallet not found]",
      );
    });

    test("should release funds", async () => {
      let createdTigerbeetleTransfer = false;
      let createdAccountStatement = false;
      let createdActivityLog = false;
      let updatedEscrow = false;
      let notifyCount = 0;

      const tigerBeetleRepo = extendTigerBeetleRepo({
        createTransfers() {
          createdTigerbeetleTransfer = true;
          return Effect.succeed([]);
        },
      });

      const accountStatementRepo = extendAccountStatementRepo({
        create() {
          createdAccountStatement = true;
          return Effect.succeed([]);
        },
      });

      const NotificationFacadeMock = extendNotificationFacade({
        notify() {
          notifyCount += 1;
          return Effect.succeed(1);
        },
      });

      const escrowRepo = extendEscrowTransactionRepo({
        //@ts-expect-error
        getEscrowDetails() {
          return Effect.succeed({
            id: "test-id",
            status: "deposit.success",
            title: "",
            description: "",
            createdBy: "",
            releaseCode:"$argon2id$v=19$m=19456,t=2,p=1$9GSSz5vugGBjZTY4t4XmmA$sKkQBR2TvVWcbFSfnZULHFjcrrCbRcK01VsxDS7TSKY",
            createdAt: new Date(2025, 2, 20),
            updatedAt: new Date(2025, 2, 20),
            activitylog: [{}],
            paymentDetails: {},
            participants: [{}],
            escrowWalletDetails: {
              id: "test-id",
              escrowId: "escrow-id",
              tigerbeetleAccountId: "1111111",
              createdAt: new Date(2025, 2, 23),
              updatedAt: new Date(2025, 2, 23),
            },
          });
        },

        update() {
          updatedEscrow = true;
          return Effect.succeed([]);
        },
      });

      const activityLogMock = extendActivityLogRepo({
        create() {
          createdActivityLog = true;
          return Effect.succeed([]);
        },
      });

      const program = releaseFunds({
        ...params,
        currentUser: { ...params.currentUser, id: "buyer-id" },
      });
      const result = await runTest(
        Effect.provide(
          program,
          tigerBeetleRepo.pipe(
            Layer.provideMerge(accountStatementRepo),
            Layer.provideMerge(NotificationFacadeMock),
            Layer.provideMerge(tigerBeetleRepo),
            Layer.provideMerge(escrowRepo),
            Layer.provideMerge(NotificationFacadeMock),
            Layer.provideMerge(activityLogMock),
          ),
        ),
      );

      expect(createdTigerbeetleTransfer).toBeTruthy();
      expect(createdAccountStatement).toBeTruthy();
      expect(updatedEscrow).toBeTruthy();
      expect(createdActivityLog).toBeTruthy();
      expect(notifyCount).toBe(2);
      expect(result).toMatchInlineSnapshot(`
        {
          "data": null,
          "message": "Funds released successfully",
          "status": "success",
        }
      `);
    });
  });

  describe("Withdraw from wallet", () => {
    const params = {
      amount: 1000,
      accountNumberId: "MOCK_ACCOUNT_NUMBER_ID",
      currentUser,
    };

    test("Should fail if invalid account number id", () => {
      const bankAccountRepo = extendBankAccountRepo({
        firstOrThrow() {
          return Effect.fail(new Error(""));
        },
      });

      const program = withdrawFromWallet(params);
      const result = runTest(Effect.provide(program, bankAccountRepo));
      expect(result).resolves.toMatchInlineSnapshot(
        "[NoSuchElementException: Invalid account number id]",
      );
    });

    test("Should fail if user wallet not found", () => {
      const userWalletRepo = extendUserWalletRepo({
        firstOrThrow() {
          return Effect.fail(new Error(""));
        },
      });

      const program = withdrawFromWallet(params);
      const result = runTest(Effect.provide(program, userWalletRepo));
      expect(result).resolves.toMatchInlineSnapshot(
        "[NoSuchElementException: wallet not found]",
      );
    });

    test("Should fail if insufficient balance", () => {
      const PaymentGatewayMock = extendPaymentGateway({
        //@ts-expect-error
        initiateTransfer() {
          return Effect.fail(new Error(""));
        },
      });

      const program = withdrawFromWallet({ ...params, amount: 10000 });
      const result = runTest(program);
      expect(result).resolves.toMatchInlineSnapshot(
        "[InsufficientBalanceException: Insufficient account balance]",
      );
    });

    test("Should fail if unable to initiate transfer", () => {
      const PaymentGatewayMock = extendPaymentGateway({
        //@ts-expect-error
        initiateTransfer() {
          return Effect.fail(new Error(""));
        },
      });

      const program = withdrawFromWallet(params);
      const result = runTest(Effect.provide(program, PaymentGatewayMock));
      expect(result).resolves.toMatchInlineSnapshot(
        "[ExpectedError: Unable to initiate transfer]",
      );
    });

    test("should process wallet withdrawal", async () => {
      let initiatedTransfer = false;
      let createdWithdrawal = false;
      let createdTigerbeetleTransfer = false;
      let createdAccountStatement = false;

      const paymentGatewayMock = extendPaymentGateway({
        //@ts-expect-error
        initiateTransfer() {
          initiatedTransfer = true;
          return Effect.succeed({
            data: {
              amount: "3000",
              reference: "ref_no",
              status: "success",
              id: "id",
              reason: "reason",
            },
            message: "message",
            status: "status",
          });
        },
      });

      const withdrawalRepo = extendWithdrawalRepo({
        create() {
          createdWithdrawal = true;
          return Effect.succeed([]);
        },
      });

      const tigerBeetleRepo = extendTigerBeetleRepo({
        createTransfers() {
          createdTigerbeetleTransfer = true;
          return Effect.succeed([]);
        },
      });

      const accountStatementRepo = extendAccountStatementRepo({
        create() {
          createdAccountStatement = true;
          return Effect.succeed([]);
        },
      });

      const program = withdrawFromWallet(params);
      const result = await runTest(
        Effect.provide(
          program,
          paymentGatewayMock.pipe(
            Layer.provideMerge(withdrawalRepo),
            Layer.provideMerge(tigerBeetleRepo),
            Layer.provideMerge(accountStatementRepo),
          ),
        ),
      );

      expect(initiatedTransfer).toBeTruthy();
      expect(createdWithdrawal).toBeTruthy();
      expect(createdTigerbeetleTransfer).toBeTruthy();
      expect(createdAccountStatement).toBeTruthy();
      expect(result).toMatchInlineSnapshot(`
        {
          "data": null,
          "message": "Withdrawal processed successfully",
          "status": "success",
        }
      `);
    });
  });
});
