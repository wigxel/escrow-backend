import type { TransferFlags } from "tigerbeetle-node";
import type { compoundLedger } from "./utils";

export type TTBAccount = {
  accountId: string;
  user_data_128?: number;
  user_data_64?: number;
  user_data_32?: number;
  reserved?: number;
  /**
   * Ledger partition accounts into groups that may represent a currency or asset type
   * Only accounts on the same ledger can transact directly
   */
  ledger?: TCompoundLedger;
  /**
   * This is a user-defined enum denoting the category of the account.
   * eg. 1001 is Bank Account and 1002 is Money Market Account
   */
  code?: TBAccountCode;
  flags?: number;
};

export type TTBTransfer = {
  transferId: string;
  debit_account_id: string;
  credit_account_id: string;
  amount: number;
  pendingId?: string;
  user_data_128?: number;
  user_data_64?: number;
  user_data_32?: number;
  timeout?: number;
  /**
   * Ledger partition accounts into groups that may represent a currency or asset type
   * Only accounts on the same ledger can transact directly
   */
  ledger?: TCompoundLedger;
  /**
   * This is a user-defined enum denoting the category of the account.
   * eg. 1001 is Bank Account and 1002 is Money Market Account
   */
  code?: TBTransferCode;
  flags?: TransferFlags;
};

export type TCompoundLedger = keyof typeof compoundLedger;

export interface ILedger {
  ledgerId: number;
  type: LedgerType;
  name: string;
  metadata: unknown;
}

// ==== ENUMS =====
export enum TBAccountCode {
  COMPANY_ACCOUNT = 1000,
  ESCROW_WALLET = 1001,
  USER_WALLET = 1002,
  BANK_ACCOUNT = 1003,
}

export enum LedgerType {
  Currency = "Currency",
}

export enum TBTransferCode {
  ESCROW_PAYMENT = 300,
  RELEASE_ESCROW_FUNDS = 400,
  WALLET_WITHDRAWAL = 500,
}
