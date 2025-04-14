import {
  createClient,
  type AccountBalance,
  type AccountFilter,
  type Transfer,
  type Client,
  AccountFlags,
} from "tigerbeetle-node";
import {
  TBAccountCode,
  type TTBTransfer,
  type TTBAccount,
  TBTransferCode,
} from "./type";
import { compoundLedger, isValidBigIntString } from "./utils";

export class TigerBeetleAdapter {
  private client: Client;
  public static instance: TigerBeetleAdapter;

  private constructor(address: number | string, clusterId = 0) {
    this.client = createClient({
      cluster_id: BigInt(clusterId),
      replica_addresses: [address],
    });
  }

  static getInstance(address: number | string, clusterId = 0) {
    if (!TigerBeetleAdapter.instance) {
      TigerBeetleAdapter.instance = new TigerBeetleAdapter(address, clusterId);
    }
    return TigerBeetleAdapter.instance;
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

  async isConnected() {
    const DEFAULT_ADDRESS = "0";

    // ping the server by performing an account lookup
    // or timeout after one second
    return await Promise.race([
      this.lookupAccounts(DEFAULT_ADDRESS)
        .then(() => true)
        .catch((err) => false),
      new Promise((res) => setTimeout(() => res(false), 3000)),
    ]);
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
        pending_id: transfer.pendingId ? BigInt(transfer.pendingId) : BigInt(0),
        ledger: ledger?.ledgerId || compoundLedger.ngnLedger.ledgerId,
        code: transfer.code || TBTransferCode.WALLET_WITHDRAWAL,
        flags: transfer.flags || 0,
        timestamp: BigInt(0),
      };
      return data;
    });

    return await this.client.createTransfers(modTransfers);
  }

  async lookupAccounts(accountId: string | string[]) {
    const accountIds = Array.isArray(accountId) ? accountId : [accountId];

    const modAccountIds = accountIds.map((acctId) => {
      // Validate and convert accountId to BigInt
      if (typeof acctId === "string" && !isValidBigIntString(acctId)) {
        throw new Error(
          `Invalid account id: ${acctId}. It must be a valid numeric string.`,
        );
      }
      return BigInt(acctId);
    });

    return await this.client.lookupAccounts(modAccountIds);
  }

  async lookupTransfers(transferId: string | string[]) {
    const transferIds = Array.isArray(transferId) ? transferId : [transferId];

    const modtransferIds = transferIds.map((transId) => {
      // Validate and convert accountId to BigInt
      if (typeof transId === "string" && !isValidBigIntString(transId)) {
        throw new Error(
          `Invalid account id: ${transId}. It must be a valid numeric string.`,
        );
      }
      return BigInt(transId);
    });

    return await this.client.lookupTransfers(modtransferIds);
  }

  getAccountTransfers: (filter: AccountFilter) => Promise<Transfer[]>;
  getAccountBalances: (filter: AccountFilter) => Promise<AccountBalance[]>;
}
