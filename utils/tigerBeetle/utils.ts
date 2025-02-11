import {
  CreateAccountError,
  type CreateAccountsError,
  CreateTransferError,
  type CreateTransfersError,
} from "tigerbeetle-node";
import { type ILedger, LedgerType } from "./type/type";
import { ExpectedError } from "~/config/exceptions";
import { Effect } from "effect";

//======= LEDGER DATA =====
export const compoundLedger: Record<string, ILedger> = {
  ngnLedger: {
    ledgerId: 10,
    type: LedgerType.Currency,
    name: "NGN ledger",
    metadata: {
      description: "Primary ledger for Nigeria Naira transaction",
    },
  },
};

export const handleCreateAccountErrors = (errors: CreateAccountsError[]) => {
  return Effect.gen(function* (_) {
    for (const error of errors) {
      yield* _(
        new ExpectedError(
          `Account at ${error.index} failed to create: ${
            CreateAccountError[error.result]
          }.`,
        ),
      );
    }
  });
};

export const handleCreateTransferErrors = (errors: CreateTransfersError[]) => {
  return Effect.gen(function* (_) {
    for (const error of errors) {
      yield* _(
        new ExpectedError(
          `Transfer at ${error.index} failed to create: ${
            CreateTransferError[error.result]
          }.`,
        ),
      );
    }
  });
};

export function isValidBigIntString(value: string): boolean {
  return /^\d+$/.test(value);
}
