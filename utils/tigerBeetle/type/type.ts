import type { compoundLedger } from "../tigerbeetle";

export type TTBAccount = {
  accountId: number|string;
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

export type TCompoundLedger = keyof typeof compoundLedger

interface Ledger {
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

