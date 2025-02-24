import { TPaystackPaymentWebhookEvent } from "~/utils/paystack/type/types";
import { extendEscrowWalletRepo } from "./mocks/escrow/escrowWalletRepoMock";
import { Effect, Layer } from "effect";
import { handleSuccessPaymentEvents } from "~/services/paystack/payment.service";
import { runTest } from "./mocks/app";
import { extendTigerBeetleRepo } from "./mocks/tigerBeetleRepoMock";
import { extendAccountStatementRepo } from "./mocks/accountStatementRepoMock";
import { extendNotificationFacade } from "./mocks/notification/notificationFacadeMock";

describe("Payment service", () => {
  describe("handle release funds", () => {
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
          createdAccountStatement = true
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
      expect(createdTigerbeetleTransfer).toBeTruthy()
      expect(createdAccountStatement).toBeTruthy()
      expect(notifyCount).toBe(2)
    });
  });
});
