export interface TPaystackResponse<T> {
  status: string;
  message: string;
  data: T;
}

export type TinitializeResponse = TPaystackResponse<{
  authorization_url: string;
  access_code: string;
  reference: string;
}>;

export type TResolveAccountResponse = TPaystackResponse<{
  account_number: string;
  account_name: string;
  bank_id: string;
}>;

export type TBankListResponse = TPaystackResponse<
  {
    name: string;
    slug: string;
    code: string;
    longcode: string;
    gateway: string;
    pay_with_bank: string;
    active: string;
    is_deleted: string;
    country: string;
    currency: string;
    type: string;
    id: string;
    createdAt: string;
    updatedAt: string;
  }[]
>;

export type TCreateTransferRecipientResponse = TPaystackResponse<{
  active: boolean;
  createdAt: string;
  currency: string;
  domain: string;
  id: number;
  integration: number;
  name: string;
  recipient_code: string;
  type: string;
  updatedAt: string;
  is_deleted: boolean;
  details: {
    authorization_code: unknown;
    account_number: string;
    account_name: string;
    bank_code: string;
    bank_name: string;
  };
}>;

export type TInitiateTransferResponse = TPaystackResponse<{
  reference: string;
  integration: number;
  domain: string;
  amount: number;
  currency: "NGN";
  source: string;
  reason: string;
  recipient: string;
  status: string;
  transfer_code: string;
  id: string;
  createdAt: string;
  updatedAt: string;
}>;
