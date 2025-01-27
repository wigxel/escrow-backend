import {
  createClient,
  type AccountBalance,
  type AccountFilter,
  type AccountID,
  type CreateTransfersError,
  type Transfer,
  type TransferID,
  type Account,
  type Client,
  type CreateAccountsError,
  AccountFlags,
  CreateAccountError,
  CreateTransferError,
} from "tigerbeetle-node";
import { LedgerType, TBAccountCode, type TTBAccount } from "./type/type";
import { Effect } from "effect";
import { ExpectedError } from "~/config/exceptions";

export class TigerBeetleAdapter {
  private client: Client;

  constructor(address: number | string, clusterId = 0) {
    this.client = createClient({
      cluster_id: BigInt(clusterId),
      replica_addresses: [address],
    });
  }

  async createAccounts(params: TTBAccount[] | TTBAccount) {
    const accounts = Array.isArray(params) ? params : [params];

    const modAccounts = accounts.map((account) => {
      const ledger = compoundLedger[account.ledger];
      const data = {
        id: BigInt(account.accountId),
        debits_pending: BigInt(0),
        debits_posted: BigInt(0),
        credits_pending: BigInt(0),
        credits_posted: BigInt(0),
        user_data_128: account.user_data_128
          ? BigInt(account.user_data_128)
          : BigInt(0),
        user_data_64: account.user_data_64
          ? BigInt(account.user_data_64)
          : BigInt(0),
        user_data_32: account.user_data_32 || 0,
        reserved: account.reserved || 0,
        ledger: ledger?.ledgerId || compoundLedger.ngnLedger.ledgerId,
        code: account.code || TBAccountCode.BANK_ACCOUNT,
        flags:
          account.flags ||
          AccountFlags.debits_must_not_exceed_credits | AccountFlags.history,
        timestamp: BigInt(0),
      };
      return data;
    });

    return await this.client.createAccounts(modAccounts);
  }

  createTransfers: (batch: Transfer[]) => Promise<CreateTransfersError[]>;

  getAccountTransfers: (filter: AccountFilter) => Promise<Transfer[]>;

  lookupAccounts: (batch: AccountID[]) => Promise<Account[]>;
  lookupTransfers: (batch: TransferID[]) => Promise<Transfer[]>;
  getAccountBalances: (filter: AccountFilter) => Promise<AccountBalance[]>;
}

//======= LEDGER DATA =====
export const compoundLedger = {
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
