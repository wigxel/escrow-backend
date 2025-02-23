import {
  createEscrowTransaction,
  finalizeEscrowTransaction,
  getEscrowRequestDetails,
  getEscrowTransactionDetails,
  initializeEscrowDeposit,
  validateUserStatusUpdate,
} from "~/services/escrow/escrowTransactionServices";
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
import { extendPaymentGateway } from "./mocks/payment/paymentGatewayMock";

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
          return Effect.succeed([
            {
              id: "test-id",
              status: "deposit.success",
              title: "",
              description: "",
              createdBy: "",
              createdAt: new Date(2025, 2, 20),
              updatedAt: new Date(2025, 2, 20),
            },
          ]);
        },
      });
      const escrowWalletRepo = extendEscrowWalletRepo({
        create() {
          createdEscrowWallet = true;
          return Effect.succeed([]);
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

  describe("Get escrow transaction details", () => {
    test("should fail if invalid escrow id", () => {
      const escrowRepo = extendEscrowTransactionRepo({
        //@ts-expect-error
        getEscrowDetails() {
          return Effect.fail(new Error(""));
        },
      });
      const program = getEscrowTransactionDetails({
        escrowId: "MOCK_ESCROW_ID",
      });
      const result = runTest(Effect.provide(program, escrowRepo));
      expect(result).resolves.toMatchInlineSnapshot(
        `[NoSuchElementException: invalid escrow id: no escrow transaction found]`,
      );
    });

    test("should get escrow details", async () => {
      const program = getEscrowTransactionDetails({
        escrowId: "MOCK_ESCROW_ID",
      });
      const result = await runTest(program);
      expect(result).toMatchInlineSnapshot(`
        {
          "data": {
            "activitylog": [
              {},
            ],
            "createdAt": 2025-03-19T23:00:00.000Z,
            "createdBy": "",
            "description": "",
            "escrowWalletDetails": {
              "balance": 1000,
              "createdAt": 2025-03-22T23:00:00.000Z,
              "escrowId": "escrow-id",
              "id": "test-id",
              "tigerbeetleAccountId": "1111111",
              "updatedAt": 2025-03-22T23:00:00.000Z,
            },
            "id": "test-id",
            "participants": [
              {},
            ],
            "paymentDetails": {},
            "status": "created",
            "title": "",
            "updatedAt": 2025-03-19T23:00:00.000Z,
          },
          "status": "success",
        }
      `);
    });
  });

  describe("Get escrow request details", () => {
    test("should fail if invalid escrow id", () => {
      const escrowRequestRepo = extendEscrowRequestRepo({
        firstOrThrow() {
          return Effect.fail(new Error(""));
        },
      });

      const program = getEscrowRequestDetails({
        currentUser,
        escrowId: "MOCK_ESCROW_ID",
      });

      const result = runTest(Effect.provide(program, escrowRequestRepo));
      expect(result).resolves.toMatchInlineSnapshot(
        `[NoSuchElementException: Invalid escrow id]`,
      );
    });

    test("should get the escrow request details", async () => {
      let isUpdated = false;
      let activityLogCreated = false;

      const escrowRepo = extendEscrowTransactionRepo({
        update() {
          isUpdated = true;
          return Effect.succeed([]);
        },
      });

      const activityLogMock = extendActivityLogRepo({
        create() {
          activityLogCreated = true;
          return Effect.succeed([]);
        },
      });

      const program = getEscrowRequestDetails({
        currentUser,
        escrowId: "MOCK_ESCROW_ID",
      });

      const result = await runTest(
        Effect.provide(program, Layer.merge(escrowRepo, activityLogMock)),
      );
      expect(isUpdated).toBeTruthy();
      expect(activityLogCreated).toBeTruthy();
      expect(result).toMatchInlineSnapshot(`
        {
          "data": {
            "isAuthenticated": true,
            "requestDetails": {
              "accessCode": null,
              "amount": "10000",
              "authorizationUrl": null,
              "createdAt": 2025-03-22T23:00:00.000Z,
              "customerEmail": "customer-email",
              "customerPhone": "customer phone",
              "customerRole": "seller",
              "customerUsername": "username",
              "escrowId": "escrow-id",
              "expiresAt": 2026-03-22T23:00:00.000Z,
              "id": "test-id",
              "senderId": "user-id",
              "status": "pending",
              "updatedAt": 2025-03-22T23:00:00.000Z,
            },
          },
        }
      `);
    });
  });

  describe("Initialize escrow deposit", () => {
    const params = {
      escrowId: "MOCK_ESCROW_ID",
      customerEmail: "MOCK_EMAIL",
      customerPhone: 11222333,
      customerUsername: "MOCK_USERNAME",
    };

    test("should fail is account exists and user not logged in", () => {
      const program = initializeEscrowDeposit(params, undefined);
      const result = runTest(program);
      expect(result).resolves.toMatchInlineSnapshot(
        `[ExpectedError: Unauthorized: signin to continue]`,
      );
    });

    test("should fail if escrow id is invalid", () => {
      const escrowRepo = extendEscrowTransactionRepo({
        firstOrThrow() {
          return Effect.fail(new Error(""));
        },
      });
      const program = initializeEscrowDeposit(params, currentUser);
      const result = runTest(Effect.provide(program, escrowRepo));
      expect(result).resolves.toMatchInlineSnapshot(
        `[NoSuchElementException: Invalid escrow transaction id]`,
      );
    });

    test("should fail if escrow status not 'deposit.pending'", () => {
      const program = initializeEscrowDeposit(params, currentUser);
      const result = runTest(program);
      expect(result).resolves.toMatchInlineSnapshot(
        `[ExpectedError: Please click the link sent to you to proceed with payment]`,
      );
    });

    test("should fail if escrow id is invalid to get escrow request details", () => {
      const escrowRepo = extendEscrowTransactionRepo({
        firstOrThrow() {
          return Effect.succeed({
            id: "test-id",
            status: "deposit.pending",
            title: "",
            description: "",
            createdBy: "",
            createdAt: new Date(2025, 2, 20),
            updatedAt: new Date(2025, 2, 20),
          });
        },
      });

      const escrowRequestRepo = extendEscrowRequestRepo({
        firstOrThrow() {
          return Effect.fail(new Error(""));
        },
      });

      const program = initializeEscrowDeposit(params, currentUser);
      const result = runTest(
        Effect.provide(program, Layer.merge(escrowRepo, escrowRequestRepo)),
      );
      expect(result).resolves.toMatchInlineSnapshot(
        `[NoSuchElementException: Invalid escrow id]`,
      );
    });

    test("should fail is escrow request has expired", () => {
      const escrowRepo = extendEscrowTransactionRepo({
        firstOrThrow() {
          return Effect.succeed({
            id: "test-id",
            status: "deposit.pending",
            title: "",
            description: "",
            createdBy: "",
            createdAt: new Date(2025, 2, 20),
            updatedAt: new Date(2025, 2, 20),
          });
        },
      });

      const escrowRequestRepo = extendEscrowRequestRepo({
        firstOrThrow() {
          return Effect.succeed({
            id: "test-id",
            senderId: "user-id",
            amount: "10000",
            escrowId: "escrow-id",
            customerUsername: "username",
            customerPhone: "customer phone",
            customerRole: "seller",
            customerEmail: "customer-email",
            status: "pending",
            accessCode: null,
            authorizationUrl: null,
            createdAt: new Date(2025, 2, 23),
            updatedAt: new Date(2025, 2, 23),
            expiresAt: new Date(2024, 2, 22),
          });
        },
      });

      const program = initializeEscrowDeposit(params, currentUser);
      const result = runTest(
        Effect.provide(program, Layer.merge(escrowRepo, escrowRequestRepo)),
      );
      expect(result).resolves.toMatchInlineSnapshot(
        `[ExpectedError: Escrow transaction request has expired]`,
      );
    });

    test("should fail if escrow creator tries to initialize deposit", () => {
      const escrowRepo = extendEscrowTransactionRepo({
        firstOrThrow() {
          return Effect.succeed({
            id: "test-id",
            status: "deposit.pending",
            title: "",
            description: "",
            createdBy: "",
            createdAt: new Date(2025, 2, 20),
            updatedAt: new Date(2025, 2, 20),
          });
        },
      });

      const escrowRequestRepo = extendEscrowRequestRepo({
        firstOrThrow() {
          return Effect.succeed({
            id: "test-id",
            senderId: "user-id",
            amount: "10000",
            escrowId: "escrow-id",
            customerUsername: "username",
            customerPhone: "customer phone",
            customerRole: "seller",
            customerEmail: "customer-email",
            status: "pending",
            accessCode: null,
            authorizationUrl: null,
            createdAt: new Date(2025, 2, 23),
            updatedAt: new Date(2025, 2, 23),
            expiresAt: new Date(2025, 2, 22),
          });
        },
      });

      const program = initializeEscrowDeposit(params, {
        ...currentUser,
        id: "user-id",
      });
      const result = runTest(
        Effect.provide(program, Layer.merge(escrowRepo, escrowRequestRepo)),
      );
      expect(result).resolves.toMatchInlineSnapshot(
        `[ExpectedError: Account associated with the escrow creation]`,
      );
    });

    test("should initialize escrow deposit", async () => {
      let createdPaymentSession = false;
      let updatedEscrowRequest = false;
      const escrowRepo = extendEscrowTransactionRepo({
        firstOrThrow() {
          return Effect.succeed({
            id: "test-id",
            status: "deposit.pending",
            title: "",
            description: "",
            createdBy: "",
            createdAt: new Date(2025, 2, 20),
            updatedAt: new Date(2025, 2, 20),
          });
        },
      });

      const escrowRequestRepo = extendEscrowRequestRepo({
        firstOrThrow() {
          return Effect.succeed({
            id: "test-id",
            senderId: "user-id",
            amount: "10000",
            escrowId: "escrow-id",
            customerUsername: "username",
            customerPhone: "customer phone",
            customerRole: "seller",
            customerEmail: "customer-email",
            status: "pending",
            accessCode: null,
            authorizationUrl: null,
            createdAt: new Date(2025, 2, 23),
            updatedAt: new Date(2025, 2, 23),
            expiresAt: new Date(2025, 2, 22),
          });
        },

        update() {
          updatedEscrowRequest = true;
          return Effect.succeed([]);
        },
      });

      const paymentGatewayMock = extendPaymentGateway({
        createSession() {
          createdPaymentSession = true;
          return Effect.succeed({
            data: {
              access_code: "access_code",
              authorization_url: "authorization_url",
              reference: "reference",
            },
            message: "",
            status: "success",
          });
        },
      });

      const program = initializeEscrowDeposit(params, currentUser);
      const result = await runTest(
        Effect.provide(
          program,
          escrowRepo.pipe(
            Layer.provideMerge(escrowRequestRepo),
            Layer.provideMerge(paymentGatewayMock),
          ),
        ),
      );
      expect(createdPaymentSession).toBeTruthy();
      expect(updatedEscrowRequest).toBeTruthy();
      expect(result).toMatchInlineSnapshot(`
        {
          "data": {
            "access_code": "access_code",
            "authorization_url": "authorization_url",
            "reference": "reference",
          },
          "message": "",
          "status": "success",
        }
      `);
    });
  });

  describe("Finalize escrow transaction", () => {
    test("should finalize escrow transaction", async () => {
      let updatedEscrowRequest = false;
      let createdParticipant = false;
      let updatedEscrowPayment = false;
      let updatedEscrow = false;
      let createdActivityLog = false;

      const escrowRequestRepo = extendEscrowRequestRepo({
        update() {
          updatedEscrowRequest = true;
          return Effect.succeed([]);
        },
      });

      const escrowParticipantRepo = extendEscrowParticipantRepo({
        create(payload) {
          createdParticipant = true;
          return Effect.succeed([]);
        },
      });

      const escrowPaymentRepo = extendEscrowPaymentRepo({
        update() {
          updatedEscrowPayment = true;
          return Effect.succeed([]);
        },
      });
      const escrowRepo = extendEscrowTransactionRepo({
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

      const program = finalizeEscrowTransaction({
        relatedUserId: "MOCK_USER_ID",
        escrowId: "MOCK_ESCROW_ID",
        customerDetails: {
          email: "MOCK_EMAIL",
          role: "buyer",
          userId: "MOCK_USER_ID",
          username: "MOCK_USERNAME",
        },
        paymentDetails: {
          amount: 10000,
          paymentMethod: "card",
          status: "success",
        },
      });
      const result = await runTest(
        Effect.provide(
          program,
          escrowRequestRepo.pipe(
            Layer.provideMerge(escrowParticipantRepo),
            Layer.provideMerge(escrowPaymentRepo),
            Layer.provideMerge(escrowRepo),
            Layer.provideMerge(activityLogMock),
          ),
        ),
      );
      expect(updatedEscrowRequest).toBeTruthy();
      expect(createdParticipant).toBeTruthy();
      expect(updatedEscrowPayment).toBeTruthy();
      expect(updatedEscrow).toBeTruthy();
      expect(createdActivityLog).toBeTruthy();
    });
  });

  describe("Validate user status update", () => {
    const params = {
      currentUser,
      escrowId: "MOCK_ESCROW_ID",
      status: "service.pending",
    };

    test("should fail if current user not seller", () => {
      const program = validateUserStatusUpdate(params);
      const result = runTest(program);
      expect(result).resolves.toMatchInlineSnapshot(
        `[ExpectedError: Unauthorized operation: service provider operation]`,
      );
    });

    test("should fail if current user not buyer", () => {
      const program = validateUserStatusUpdate({
        ...params,
        status: "service.confirmed",
      });
      const result = runTest(program);
      expect(result).resolves.toMatchInlineSnapshot(
        `[ExpectedError: Unauthorized operation: service consumer operation]`,
      );
    });

    test("should retuen seller and buyer details", async () => {
      const program = validateUserStatusUpdate({
        ...params,
        currentUser: { ...params.currentUser, id: "buyer-id" },
        status: "service.confirmed",
      });
      const result = runTest(program);
      expect(result).resolves.toMatchInlineSnapshot(`
        {
          "buyer": {
            "escrowId": "escrow-id",
            "id": "id",
            "role": "buyer",
            "status": "active",
            "userId": "buyer-id",
          },
          "seller": {
            "escrowId": "escrow-id",
            "id": "id",
            "role": "seller",
            "status": "active",
            "userId": "seller-id",
          },
        }
      `);
    });
  });
});
