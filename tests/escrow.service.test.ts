import { createEscrowTransaction } from "~/services/escrow/escrowTransactionServices";
import { runTest } from "./mocks/app";
import { extendEscrowTransactionRepo } from "./mocks/escrow/escrowTransactionRepoMock";
import { Effect, Layer } from "effect";
import { extendEscrowWalletRepo } from "./mocks/escrow/escrowWalletRepoMock";
import { extendTigerBeetleRepo } from "./mocks/tigerBeetleRepoMock";
import { extendEscrowParticipantRepo } from "./mocks/escrow/escrowParticipantsRepoMock";
import { extendEscrowPaymentRepo } from "./mocks/escrow/escrowPaymentRepoMock";
import { extendEscrowRequestRepo } from "./mocks/escrow/escrowRequestReoMock";
import { extendActivityLogRepo } from "./mocks/activityLogRepoMock";
import { toRuntimeWithMemoMap } from "effect/Layer";

describe("Escrow transaction service", () => {
  const currentUser = {
    email: "",
    id: "MOCK_USER_ID",
    username: "username",
    phone: "",
    role: "",
  };

  describe("Create escrow transaction", () => {
    const params = {
      amount: 10000,
      creatorRole: "seller" as "seller",
      customerEmail: "MOCK_EMAIL",
      customerPhone: 11222333,
      customerUsername: "MOCK_USERNAME",
      description: "description",
      terms: "terms",
      title: "title",
    };

    test("should fail if customer id equal current user id", () => {
      const program = createEscrowTransaction(params, {
        ...currentUser,
        id: "user-id",
      });
      const result = runTest(program);
      expect(result).resolves.toMatchInlineSnapshot(
        `[ExpectedError: You cannot create transaction with yourself]`,
      );
    });

    test("should create a new escrow transaction", async () => {
      let createdEscrow = false;
      let createdEscrowWallet = false;
      let createdTigerbeetleAccount = false;
      let createdParticipant = false;
      let createdPayment = false;
      let createdEscrowRequest = false;
      let createdActivityLog = false;

      const escrowRepo = extendEscrowTransactionRepo({
        create() {
          createdEscrow = true;
          return Effect.succeed([{
            id: "test-id",
            status: "deposit.success",
            title: "",
            description: "",
            createdBy: "",
            createdAt: new Date(2025, 2, 20),
            updatedAt: new Date(2025, 2, 20),
          }]);
        },
      });
      const escrowWalletRepo = extendEscrowWalletRepo({
        create() {
          createdEscrowWallet = true;
          return Effect.succeed([
          ]);
        },
      });
      const tigerbeetleRepo = extendTigerBeetleRepo({
        createAccounts() {
          createdTigerbeetleAccount = true;
          return Effect.succeed([]);
        },
      });
      const escrowParticipantRepo = extendEscrowParticipantRepo({
        create() {
          createdParticipant = true;
          return Effect.succeed([]);
        },
      });
      const escrowPaymentRepo = extendEscrowPaymentRepo({
        create() {
          createdPayment = true;
          return Effect.succeed([]);
        },
      });
      const escrowRequestRepo = extendEscrowRequestRepo({
        create() {
          createdEscrowRequest = true;
          return Effect.succeed([]);
        },
      });
      const activityLogMock = extendActivityLogRepo({
        create() {
          createdActivityLog = true;
          return Effect.succeed([]);
        },
      });

      const program = createEscrowTransaction(params, currentUser);
      const result = await runTest(
        Effect.provide(
          program,
          escrowRepo.pipe(
            Layer.provideMerge(escrowWalletRepo),
            Layer.provideMerge(tigerbeetleRepo),
            Layer.provideMerge(escrowParticipantRepo),
            Layer.provideMerge(escrowPaymentRepo),
            Layer.provideMerge(escrowRequestRepo),
            Layer.provideMerge(activityLogMock),
          ),
        ),
      );

      expect(createdEscrow).toBeTruthy();
      expect(createdEscrowWallet).toBeTruthy();
      expect(createdTigerbeetleAccount).toBeTruthy();
      expect(createdParticipant).toBeTruthy();
      expect(createdPayment).toBeTruthy();
      expect(createdEscrowRequest).toBeTruthy();
      expect(createdActivityLog).toBeTruthy();
      expect(result).toMatchInlineSnapshot(`
        {
          "data": {
            "escrowTransactionId": "test-id",
          },
          "status": "success",
        }
      `);
    });
  });
});
