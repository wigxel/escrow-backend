import type { Address } from "nodemailer/lib/mailer";
import type { Product } from "~/migrations/schema";

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

export type searchResult = Product & {
  image_url: string;
};
