import {
  addNewBankAccount,
  deleteBankAcounts,
  getBankList,
  getUserBankAccounts,
  resolveAccountNumber,
} from "~/services/bank.service";
import { runTest } from "./mocks/app";
import { extendBankAccountRepo } from "./mocks/user/bankAccountMock";
import { Effect, Layer } from "effect";
import { extendPaymentGateway } from "./mocks/payment/paymentGatewayMock";
import { extendBankAccountVerificationRepo } from "./mocks/user/bankVerificationMock";
import { TCreateTransferRecipientResponse } from "~/utils/paystack/type/types";
import { extendTigerBeetleRepo } from "./mocks/tigerBeetleRepoMock";

describe("Bank service", () => {
  const currentUser = {
    id: "user-id",
    email: "email",
    username: "username",
    role: "user",
    phone: "12121",
  };

  describe("Get bank list", () => {
    test("should return all bank lists", async () => {
      const program = getBankList();
      const result = await runTest(program);
      expect(result).toMatchInlineSnapshot(`
        {
          "data": [
            {
              "active": "active",
              "code": "112",
              "id": "bank-id",
              "name": "bank name",
            },
          ],
          "message": "",
          "status": "",
        }
      `);
    });
  });

  describe("Get user bank accounts", () => {
    test("should fetch all users bank account", async () => {
      const program = getUserBankAccounts(currentUser);
      const result = await runTest(program);
      expect(result).toMatchInlineSnapshot(`
        {
          "data": [
            {
              "accountName": "account name",
              "accountNumber": "1122334556",
              "bankCode": "232",
              "bankName": "gtb",
              "createdAt": 2025-03-21T23:00:00.000Z,
              "deletedAt": 2025-03-21T23:00:00.000Z,
              "id": "1",
              "isDefault": false,
              "paystackRecipientCode": "rec_code",
              "tigerbeetleAccountId": "1111111",
              "updatedAt": 2025-03-21T23:00:00.000Z,
              "userId": "user-id",
            },
          ],
          "status": "success",
        }
      `);
    });
  });

  describe("Delete bank accounts", () => {
    const params = { currentUser, bankAccountId: "MOCK_BANK_ACCOUNT_ID" };
    test("should fail if bank account not found", () => {
      const bankAccountRepo = extendBankAccountRepo({
        firstOrThrow() {
          return Effect.fail(new Error("Account not found"));
        },
      });

      const program = deleteBankAcounts(params);
      const result = runTest(Effect.provide(program, bankAccountRepo));
      expect(result).resolves.toMatchInlineSnapshot(
        `[NoSuchElementException: Invalid bank account id]`,
      );
    });

    test("should fail current user doesn't own the account", () => {
      const program = deleteBankAcounts({
        currentUser: { ...params.currentUser, id: "FAKE_USER_ID" },
        bankAccountId: params.bankAccountId,
      });
      const result = runTest(program);
      expect(result).resolves.toMatchInlineSnapshot(
        `[ExpectedError: Unathorized action: cannot delete bank account]`,
      );
    });

    test("should update the deleteAt of the bank account", async () => {
      let isUpdated = false;
      const bankAccountRepo = extendBankAccountRepo({
        update() {
          isUpdated = true;
          return Effect.succeed([]);
        },
      });

      const program = deleteBankAcounts(params);
      const result = await runTest(Effect.provide(program, bankAccountRepo));
      expect(isUpdated).toBeTruthy();
      expect(result).toMatchInlineSnapshot(`
        {
          "data": null,
          "message": "Bank account deleted",
          "status": "success",
        }
      `);
    });
  });

  describe("Resolve Account number", () => {
    const params = { accountNumber: "110001", bankCode: "233" };
    test("should fail if account is already available", () => {
      const program = resolveAccountNumber(params, currentUser);
      const result = runTest(program);
      expect(result).resolves.toMatchInlineSnapshot(
        `[ExpectedError: Account already exists]`,
      );
    });

    test("should fail if paystack couldn't resolve bank account", () => {
      const bankAccountRepo = extendBankAccountRepo({
        firstOrThrow() {
          return Effect.fail(new Error(""));
        },
      });

      const paymentGatewayMock = extendPaymentGateway({
        //@ts-expect-error
        resolveBankAccount() {
          return Effect.fail(new Error(""));
        },
      });

      const program = resolveAccountNumber(params, currentUser);
      const result = runTest(
        Effect.provide(
          program,
          Layer.merge(bankAccountRepo, paymentGatewayMock),
        ),
      );
      expect(result).resolves.toMatchInlineSnapshot(
        `[ExpectedError: Unknown bank code: 233 or Could not resolve account name]`,
      );
    });

    test("should create new bank account for verification", async () => {
      let isCreated = false;
      const bankAccountRepo = extendBankAccountRepo({
        firstOrThrow() {
          return Effect.fail(new Error(""));
        },
      });

      const bankVerificationRepo = extendBankAccountVerificationRepo({
        create() {
          isCreated = true;
          return Effect.succeed([]);
        },
      });

      const program = resolveAccountNumber(params, currentUser);
      const result = await runTest(
        Effect.provide(
          program,
          Layer.merge(bankAccountRepo, bankVerificationRepo),
        ),
      );
      expect(isCreated).toBeTruthy();
      expect(result).toHaveProperty("data");
      expect(result).toMatchInlineSnapshot(
        {
          data: {
            accountName: "account-name",
            accountNumber: "111110000",
            token: expect.any(String),
          },
          status: "success",
        },
        `
        {
          "data": {
            "accountName": "account-name",
            "accountNumber": "111110000",
            "token": Any<String>,
          },
          "status": "success",
        }
      `,
      );
    });
  });

  describe("Add new bank account", () => {
    test("should fail if invalid bank verification token", () => {
      const bankVerificationRepo = extendBankAccountVerificationRepo({
        firstOrThrow() {
          return Effect.fail(new Error(""));
        },
      });

      const program = addNewBankAccount("TOKEN", currentUser);
      const result = runTest(Effect.provide(program, bankVerificationRepo));
      expect(result).resolves.toMatchInlineSnapshot(
        `[NoSuchElementException: Invalid bank account token]`,
      );
    });

    test("shoulf fail if account details are wrong", () => {
      const paymentGatewayMock = extendPaymentGateway({
        //@ts-expect-error
        createTransferRecipient(payload) {
          return Effect.fail("");
        },
      });

      const program = addNewBankAccount("TOKEN", currentUser);
      const result = runTest(Effect.provide(program, paymentGatewayMock));
      expect(result).resolves.toMatchInlineSnapshot(
        `[ExpectedError: couldn't create transfer recipient: account details are wrong]`,
      );
    });

    test("should create the transfer recipient", async () => {
      let transferRecipientCreated = false;
      let createdBankAccount = false;
      let createdTigerbeetleAccount = false;
      let deletedBankVerification = false;

      const paymentGatewayMock = extendPaymentGateway({
        createTransferRecipient(payload) {
          transferRecipientCreated = true
          return Effect.succeed({
            data: {
              recipient_code: "res-112",
              name: "",
              active: true,
              details: {
                account_name: "account-name",
                bank_code: "234",
                bank_name: "gtb",
                account_number: "1111111",
                authorization_code: "auth_code",
              },
            },
            message: "transfer recipient created",
            status: "success",
          } as TCreateTransferRecipientResponse);
        },
      });

      const bankAccountRepo = extendBankAccountRepo({
        create() {
          createdBankAccount = true;
          return Effect.succeed([]);
        },
      });

      const tigerbeetleRepo = extendTigerBeetleRepo({
        createAccounts() {
          createdTigerbeetleAccount = true;
          return Effect.succeed([]);
        },
      });

      const bankVerificationRepo = extendBankAccountVerificationRepo({
        delete(){
          deletedBankVerification = true
          return Effect.succeed(true)
        }
      })

      const program = addNewBankAccount("TOKEN", currentUser);
      const result = await runTest(
        Effect.provide(
          program,
          paymentGatewayMock.pipe(
            Layer.provideMerge(bankAccountRepo),
            Layer.provideMerge(tigerbeetleRepo),
            Layer.provideMerge(bankVerificationRepo),
          ),
        ),
      );

      expect(transferRecipientCreated).toBeTruthy();
      expect(createdBankAccount).toBeTruthy();
      expect(createdTigerbeetleAccount).toBeTruthy();
      expect(deletedBankVerification).toBeTruthy();
      expect(result).toMatchInlineSnapshot(`
        {
          "data": null,
          "message": "Bank account added",
          "status": "success",
        }
      `)
    });
  });
});
