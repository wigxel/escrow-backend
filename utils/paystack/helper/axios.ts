import axios, { type AxiosInstance } from "axios";

class Axios {
  private static instance: AxiosInstance;

  private constructor() {}

  public static getInstance(secretKey: string): AxiosInstance {
    if (!Axios.instance) {
      Axios.instance = axios.create({
        baseURL: "https://api.paystack.co",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json",
        },
      });
    }
    return Axios.instance;
  }
}

export default Axios;
