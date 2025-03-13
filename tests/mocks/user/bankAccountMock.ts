import { Effect, Layer } from "effect";
import { extendMockImplementation } from "../helpers";
import {
  BankAccountRepo,
  type BankAccountRepository,
} from "../../../repositories/accountNumber.repo";

export const bankAccountMockData = {
  id: "1",
  userId: "user-id",
  paystackRecipientCode: "rec_code",
  tigerbeetleAccountId: "1111111",
  bankName: "gtb",
  bankCode: "232",
  accountNumber: "1122334556",
  accountName: "account name",
  isDefault: false,
  createdAt: new Date(2025, 2, 22),
  updatedAt: new Date(2025, 2, 22),
  deletedAt: new Date(2025, 2, 22),
};

const mock: BankAccountRepository = {
  create: (data) => {
    return Effect.succeed([bankAccountMockData]);
  },

  all: (params) => {
    return Effect.succeed([bankAccountMockData]);
  },

  count: (params) => {
    return Effect.succeed(1);
  },

  delete: (params) => {
    return Effect.void;
  },

  find: () => {
    throw new Error("Function not implemented.");
  },

  firstOrThrow: (arg) => {
    return Effect.succeed(bankAccountMockData);
  },

  update: () => {
    return Effect.succeed([bankAccountMockData]);
  },
};

export const extendBankAccountRepo = extendMockImplementation(
  BankAccountRepo,
  () => mock,
);
export const BankAccountRepoTest = Layer.succeed(BankAccountRepo, mock);
