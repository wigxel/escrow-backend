import { Effect, Layer } from "effect";
import { extendWithdrawalRepo } from "./mocks/withdrawalRepoMock";
import {
  transferSuccessEvent,
  unsuccessfulTransferEvent,
} from "../services/webhook.service";
import type { TPaystackTransferWebhookEvent } from "../utils/paystack/type/types";
import { runTest } from "./mocks/app";
import { extendTigerBeetleRepo } from "./mocks/tigerBeetleRepoMock";
import { extendAccountStatementRepo } from "./mocks/accountStatementRepoMock";

describe("Webhook service", () => {
  describe("Transfer success event", () => {
    const params = {
      data: { status: "success", reference: "ref_CODE" },
      event: "transfer.success",
    } as TPaystackTransferWebhookEvent;

    test("should fail if withdrawal reference code is invalid", () => {
      const withdrawalRepo = extendWithdrawalRepo({
        firstOrThrow() {
          return Effect.fail(new Error(""));
        },
      });

      const program = transferSuccessEvent(params);
      const result = runTest(Effect.provide(program, withdrawalRepo));
      expect(result).resolves.toMatchInlineSnapshot(
        "[NoSuchElementException: Invalid withdrawal id]",
      );
    });

    test("should finalize transfer success", async () => {
      let updateWithdrawal = false;
      let createdTigerbeetleTransfer = false;
      let updatedAccountStatement = false;
      const withdrawalRepo = extendWithdrawalRepo({
        update() {
          updateWithdrawal = true;
          return Effect.succeed([]);
        },
      });

      const tigerBeetleRepo = extendTigerBeetleRepo({
        createTransfers() {
          createdTigerbeetleTransfer = true;
          return Effect.succeed([]);
        },
      });

      const accountStatementRepoMock = extendAccountStatementRepo({
        update() {
          updatedAccountStatement = true;
          return Effect.succeed([]);
        },
      });

      const program = transferSuccessEvent(params);
      const result = await runTest(
        Effect.provide(
          program,
          withdrawalRepo.pipe(
            Layer.provideMerge(tigerBeetleRepo),
            Layer.provideMerge(accountStatementRepoMock),
          ),
        ),
      );

      expect(updateWithdrawal).toBeTruthy();
      expect(createdTigerbeetleTransfer).toBeTruthy();
      expect(updatedAccountStatement).toBeTruthy();
    });
  });

  describe("Unsuccessful transfer event", () => {
    const params = {
      data: { status: "success", reference: "ref_CODE" },
      event: "transfer.success",
    } as TPaystackTransferWebhookEvent;

    test("should fail if withdrawal reference code is invalid", () => {
      const withdrawalRepo = extendWithdrawalRepo({
        firstOrThrow() {
          return Effect.fail(new Error(""));
        },
      });

      const program = unsuccessfulTransferEvent(params);
      const result = runTest(Effect.provide(program, withdrawalRepo));
      expect(result).resolves.toMatchInlineSnapshot(
        "[NoSuchElementException: Invalid withdrawal id]",
      );
    });

    test("should finalize unsuccessful transfer event", async () => {
      let updateWithdrawal = false;
      let createdTigerbeetleTransfer = false;
      let deletedAccountStatement = false;
      const withdrawalRepo = extendWithdrawalRepo({
        update() {
          updateWithdrawal = true;
          return Effect.succeed([]);
        },
      });

      const tigerBeetleRepo = extendTigerBeetleRepo({
        createTransfers() {
          createdTigerbeetleTransfer = true;
          return Effect.succeed([]);
        },
      });

      const accountStatementRepoMock = extendAccountStatementRepo({
        delete() {
          deletedAccountStatement = true;
          return Effect.succeed([]);
        },
      });

      const program = unsuccessfulTransferEvent(params);
      const result = await runTest(
        Effect.provide(
          program,
          withdrawalRepo.pipe(
            Layer.provideMerge(tigerBeetleRepo),
            Layer.provideMerge(accountStatementRepoMock),
          ),
        ),
      );

      expect(updateWithdrawal).toBeTruthy();
      expect(createdTigerbeetleTransfer).toBeTruthy();
      expect(deletedAccountStatement).toBeTruthy();
    });
  });
});
