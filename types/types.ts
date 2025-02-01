import type { Address } from "nodemailer/lib/mailer";

export type ApiResponse<T = null> = {
  success: boolean;
  message: string;
  data: T;
};

export type SendMailRaw = {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  from?: string | Address;
};

type ShapeOf<T> = Record<keyof T, unknown>;

export type AssertKeysEqual<X extends ShapeOf<Y>, Y extends ShapeOf<X>> = never;

export type TAccountStatementMetadata = {
  escrowId?:string,
  from:string,
  to:string,
  description:string
}

export type TSuccessPaymentMetaData = {
  escrowId: string;
  customerDetails: {
    userId: string;
    email: string;
    username: string;
    role: "buyer" | "seller";
  };
  relatedUserId: string;
};

export type TPaymentDetails = {
  amount: number;
  status: string;
  paymentMethod: string;
};


export type TPaystackEventResponse = {
  event: string;
  data: {
    amount: string;
    reference: string;
    status: string;
    channel: string;
    metadata: Record<string,unknown>;
  };
};

export type CurrencyUnit = "naira-kobo" | "kobo-naira";

