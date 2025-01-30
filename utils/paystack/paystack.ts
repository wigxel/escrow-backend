import type { AxiosInstance } from "axios";
import Axios from "./helper/axios";
import type {
  TCreateTransferRecipientData,
  TInitializeTransactionData,
  TInitiateTransferData,
} from "./type/data";
import { errorHandler } from "./helper/errorHandler";
import type {
  TBankListResponse,
  TCreateTransferRecipientResponse,
  TinitializeResponse,
  TInitiateTransferResponse,
  TResolveAccountResponse,
} from "./type/types";
import crypto from "node:crypto";

export class Paystack {
  private axiosInstance: AxiosInstance;

  public constructor(private secretKey: string) {
    this.axiosInstance = Axios.getInstance(this.secretKey);
  }

  /**
   * this method verifies events sent to your webhook URL are from Paystack:
   *
   * @param {Record<string unknown>} payload - this is the body of the request
   * @param {string} signature - this is signature on the event header [x-paystack-signature]
   * sent from paystack to the callback url
   * @returns {IResponse<TinitializeResponse>}
   */
  verifyWebhookSignature(
    payload: Record<string, unknown>,
    signature: string,
  ): boolean {
    const hash = crypto
      .createHmac("sha512", this.secretKey)
      .update(JSON.stringify(payload))
      .digest("hex");

    return hash === signature;
  }

  /**
   * Helper method to handle POST requests with error handling and response processing.
   *
   * @param {string} url - The API endpoint.
   * @param {object} payload - The request payload.
   * @param {T} responseType - The expected response type.
   * @returns {Promise<T>} - The API response data or throws an error incase of failure.
   */
  private async postRequest<T>(
    url: string,
    payload?: Record<string, unknown>,
  ): Promise<T> {
    try {
      const response = await this.axiosInstance.post<T>(url, payload);
      return response.data;
    } catch (e) {
      errorHandler(e);
    }
  }

  /**
   * Helper method to handle GET requests with error handling.
   *
   * @param {string} url - The API endpoint.
   * @param {object} params - Query parameters to send with the request.
   * @param {T} responseType - The expected response type.
   * @returns {Promise<T>} - The API response data or throws an error.
   */
  private async getRequest<T>(
    url: string,
    params?: Record<string, unknown>,
  ): Promise<T> {
    try {
      const response = await this.axiosInstance.get<T>(url, { params });
      return response.data;
    } catch (e) {
      errorHandler(e);
    }
  }

  /**
   * This function processes payment requests and determines the most
   * appropriate payment method for a customer.
   *
   * @param {TInitializeTransactionData} payload
   * @returns {IResponse<TinitializeResponse>}
   */
  async initializeTransaction(payload: TInitializeTransactionData) {
    const url = "/transaction/initialize";
    return await this.postRequest<TinitializeResponse>(url, payload);
  }

  /**
   * Used for the confirmation of personal bank accounts
   */
  async resolveAccountNumber(accountNumber: number, bankCode: number) {
    const url = "/bank/resolve";
    return await this.getRequest<TResolveAccountResponse>(url, {
      account_number: accountNumber,
      bank_code: bankCode,
    });
  }

  /**
   * fetch a list of banks in a country
   * @param currency
   * @returns
   */
  async listBanks(currency = "NGN") {
    const url = "/bank";
    return await this.getRequest<TBankListResponse>(url, { currency });
  }

  /**
   * this creates a transfer recipient
   * A transfer recipient is a beneficiary created on your integration in order to allow you send money.
   * @param payload
   * @returns
   */
  async createTransferRecipient(payload: TCreateTransferRecipientData) {
    const url = "/transferrecipient";
    return await this.postRequest<TCreateTransferRecipientResponse>(
      url,
      payload,
    );
  }

  /**
   * Initiate money transfer to customer
   * @param payload 
   * @returns 
   */
  async initiateTransfer(payload: TInitiateTransferData) {
    const url = "/transfer";
    return await this.postRequest<TInitiateTransferResponse>(url, {
      amount: payload.amount,
      reference: payload.referenceCode,
      recipient: payload.recipientCode,
      source: payload.source || "balance",
      reason: payload.reason || "Withdrawal from escrow wallet",
    });
  }
}
