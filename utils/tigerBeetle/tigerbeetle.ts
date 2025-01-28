import {
  createClient,
  type AccountBalance,
  type AccountFilter,
  type AccountID,
  type Transfer,
  type TransferID,
  type Account,
  type Client,
  AccountFlags,
} from "tigerbeetle-node";
import { TBAccountCode, type TTBTransfer, type TTBAccount, TBTransferReason } from "./type/type";
import { compoundLedger, isValidBigIntString } from "./utils";

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

      // Validate and convert accountId to BigInt
      if (
        typeof account.accountId === "string" &&
        !isValidBigIntString(account.accountId)
      ) {
        throw new Error(
          `Invalid accountId: ${account.accountId}. It must be a valid numeric string.`,
        );
      }

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

  async createTransfers(params: TTBTransfer[] | TTBTransfer) {
    const transfers = Array.isArray(params) ? params : [params];

    const modTransfers = transfers.map((transfer) => {
      const ledger = compoundLedger[transfer.ledger];

      // Validate and convert accountId to BigInt
      if (
        typeof transfer.transferId === "string" &&
        !isValidBigIntString(transfer.transferId)
      ) {
        throw new Error(
          `Invalid transferId: ${transfer.transferId}. It must be a valid numeric string.`,
        );
      }

      const data = {
        id: BigInt(transfer.transferId),
        debit_account_id: BigInt(transfer.debit_account_id),
        credit_account_id: BigInt(transfer.credit_account_id),
        /**
         * convert to the smallest currency unit Kobo
         */
        amount: BigInt(transfer.amount),
        user_data_128: transfer.user_data_128
          ? BigInt(transfer.user_data_128)
          : BigInt(0),
        user_data_64: transfer.user_data_64
          ? BigInt(transfer.user_data_64)
          : BigInt(0),
        user_data_32: transfer.user_data_32 || 0,
        timeout: 0,
        pending_id: transfer.pending_id || BigInt(0),
        ledger: ledger?.ledgerId || compoundLedger.ngnLedger.ledgerId,
        code: transfer.code || TBTransferReason.WALLET_WITHDRAWAL,
        flags: transfer.flags || 0,
        timestamp: BigInt(0),
      };
      return data;
    });

    return await this.client.createTransfers(modTransfers);
  }

  getAccountTransfers: (filter: AccountFilter) => Promise<Transfer[]>;

  lookupAccounts: (batch: AccountID[]) => Promise<Account[]>;
  lookupTransfers: (batch: TransferID[]) => Promise<Transfer[]>;
  getAccountBalances: (filter: AccountFilter) => Promise<AccountBalance[]>;
}
