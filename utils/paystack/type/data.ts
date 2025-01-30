export type TInitializeTransactionData = {
  email: string;
  amount: string; //Amount should be in the subunit of the,
  callback_url?: string;
  currency?: string;
  reference?: string; // Unique transaction reference
  metadata?: Record<string, unknown>;
};

export type TInitiateTransferData = {
  source?: "balance";
  amount: number;
  referenceCode: string;
  recipientCode: string;
  reason?: string;
};

export type TCreateTransferRecipientData =
  | {
      type: "nuban";
      /**
       * bank account name
       */
      name: string;
      account_number: string;
      bank_code: string;
      currency: "NGN";
    }
  | {
      type: "authorization";
      name: string;
      email: string;
      authorization_code: string;
    };
