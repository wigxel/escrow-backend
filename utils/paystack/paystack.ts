import type { AxiosInstance } from "axios";
import Axios from "./helper/axios";
import type { TInitializeTransactionData } from "./type/data";
import { errorHandler } from "./helper/errorHandler";
import type { TinitializeResponse } from "./type/types";

class Paystack {
  private axiosInstance: AxiosInstance;

  public constructor(private secreteKey: string) {
    this.axiosInstance = Axios.getInstance(secreteKey);
  }

  /**
   * This function processes payment requests and determines the most
   * appropriate payment method for a customer. 
   *
   * @param {Record<string unknown>} customerData
   * @returns {IResponse<TinitializeResponse>}
   */
  async initializeTransaction(payload:TInitializeTransactionData){
    try{
      const url = '/transaction/initialize'
      const response = await this.axiosInstance.post<TinitializeResponse>(url,payload)
      return response.data
    }catch(e){
      errorHandler(e)
    }
  }
}
