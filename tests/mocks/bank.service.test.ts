import { getBankList, getUserBankAccounts } from "~/services/bank.service";
import { runTest } from "./app";

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
      const result = await runTest(program)
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
      `)
    });
  });
});
