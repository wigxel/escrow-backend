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

export type TPaystackPaymentWebhookEvent = {
  event: string;
  data: {
    id: number;
    domain: string;
    status: string;
    reference: string;
    amount: number;
    message: string;
    gateway_response: string;
    paid_at: string;
    created_at: string;
    channel: string;
    currency: string;
    ip_address: string;
    metadata: Record<string, unknown>;
    fees_breakdown: string;
    log: string;
    fees: number;
    fees_split: string;
    authorization: {
      authorization_code: string;
      bin: string;
      last4: string;
      exp_month: string;
      exp_year: string;
      channel: string;
      card_type: string;
      bank: string;
      country_code: string;
      brand: string;
      reusable: boolean;
      signature: string;
      account_name: string;
      receiver_bank_account_number: string;
      receiver_bank: string;
    };
    customer: {
      id: string;
      first_name: string;
      last_name: string;
      email: string;
      customer_code: string;
      phone: string;
      metadata: Record<string, unknown>;
      risk_action: string;
      international_format_phone: string;
    };
    plan: Record<string, unknown>;
    subaccount: Record<string, unknown>;
    split: Record<string, unknown>;
    order_id: null;
    paidAt: string;
    requested_amount: number;
    pos_transaction_data: Record<string, unknown>;
    source: {
      type: string;
      source: string;
      entry_point: string;
      identifier: unknown;
    };
  };
};

export type TPaystackTransferWebhookEvent = {
  event: string;
  data: {
    amount: number;
    currency: string;
    domain: string;
    failures: unknown;
    id: string;
    integration: {
      id: string;
      is_live: boolean;
      business_name: string;
    };
    reason: string;
    reference: string;
    source: string;
    source_details: unknown;
    status: string;
    titan_code: string;
    transfer_code: string;
    transferred_at: string;
    recipient: {
      active: boolean;
      currency: string;
      description: string;
      domain: string;
      email: string;
      id: string;
      integration: string;
      metadata: unknown;
      name: string;
      recipient_code: string;
      type: string;
      is_deleted: boolean;
      details: {
        account_number: string;
        account_name: string;
        bank_code: string;
        bank_name: string;
      };
      created_at: string;
      updated_at: string;
    };
    session: {
      provider: string;
      id: string;
    };
    created_at: string;
    updated_at: string;
  };
};

export type TPaystackWebookEvent =
  | TPaystackPaymentWebhookEvent
  | TPaystackTransferWebhookEvent;
