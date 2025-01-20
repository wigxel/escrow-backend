import type { AxiosInstance } from "axios";
import Axios from "./helper/axios";
import type { TInitializeTransactionData } from "./type/data";
import { errorHandler } from "./helper/errorHandler";
import type { TinitializeResponse } from "./type/types";
import crypto from "node:crypto";

export class Paystack {
  private axiosInstance: AxiosInstance;

  public constructor(private secretKey: string) {
    this.axiosInstance = Axios.getInstance(this.secretKey);
  }

  /**
   * This function processes payment requests and determines the most
   * appropriate payment method for a customer.
   *
   * @param {TInitializeTransactionData} payload
   * @returns {IResponse<TinitializeResponse>}
   */
  async initializeTransaction(payload: TInitializeTransactionData) {
    try {
      const url = "/transaction/initialize";
      const response = await this.axiosInstance.post<TinitializeResponse>(
        url,
        payload,
      );
      return response.data;
    } catch (e) {
      errorHandler(e);
    }
  }

  /**
   * this method verifies events sent to your webhook URL are from Paystack:
   *
   * @param {Record<string unknown>} payload - this is the body of the request
   * @param {string} signature - this is signature on the event header [x-paystack-signature]
   * sent from paystack to the callback url
   * @returns {IResponse<TinitializeResponse>}
   */
  verifyWebhookSignature(payload: unknown, signature: string): boolean {
    const hash = crypto
      .createHmac("sha512", this.secretKey)
      .update(JSON.stringify(payload))
      .digest("hex");

    return hash === signature;
  }
}
