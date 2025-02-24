import { TPaystackPaymentWebhookEvent } from "~/utils/paystack/type/types";
import { extendEscrowWalletRepo } from "./mocks/escrow/escrowWalletRepoMock";
import { Effect, Layer } from "effect";
import {
  handleSuccessPaymentEvents,
  releaseFunds,
} from "~/services/paystack/payment.service";
import { runTest } from "./mocks/app";
import { extendTigerBeetleRepo } from "./mocks/tigerBeetleRepoMock";
import { extendAccountStatementRepo } from "./mocks/accountStatementRepoMock";
import { extendNotificationFacade } from "./mocks/notification/notificationFacadeMock";
import { extendEscrowTransactionRepo } from "./mocks/escrow/escrowTransactionRepoMock";
import { extendUserWalletRepo } from "./mocks/user/userWalletMock";
import { extendActivityLogRepo } from "./mocks/activityLogRepoMock";

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
        `[ExpectedError: Invalid escrow id: wallet not found]`,
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
    const params = { currentUser, escrowId: "MOCK_ESCROW_ID" };
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
        `[NoSuchElementException: Invalid escrow transaction id]`,
      );
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
        `[ExpectedError: This transaction has already been completed.]`,
      );
    });

    test("should fail if cannot legally transition escrow status", () => {
      const program = releaseFunds(params);
      const result = runTest(program);
      expect(result).resolves.toMatchInlineSnapshot(`[ExpectedError: Cannot transition from created to completed]`);
    });

    test("should fail if recipient wallet not found", ()=>{
      const escrowRepo = extendEscrowTransactionRepo({
        //@ts-expect-error
        getEscrowDetails() {
          return Effect.succeed({
            id: "test-id",
            status: "deposit.success",
            title: "",
            description: "",
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

      const userWalletRepo = extendUserWalletRepo({
        firstOrThrow(){
          return Effect.fail(new Error(""))
        }
      })

      const program = releaseFunds({...params, currentUser:{...params.currentUser,id:"buyer-id"}});
      const result = runTest(Effect.provide(program, Layer.merge(escrowRepo,userWalletRepo)));
      expect(result).resolves.toMatchInlineSnapshot(`[NoSuchElementException: Invalid user id: user wallet not found]`)      
    })

    test("should release funds", async ()=>{
      let createdTigerbeetleTransfer = false;
      let createdAccountStatement = false;
      let createdActivityLog = false
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

        update(){
          updatedEscrow = true
          return Effect.succeed([])
        }
      });

      const activityLogMock = extendActivityLogRepo({
        create(){
          createdActivityLog = true
          return Effect.succeed([])
        }
      })

      const program = releaseFunds({...params, currentUser:{...params.currentUser,id:"buyer-id"}});
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
      `)
    })
  });
});
