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
