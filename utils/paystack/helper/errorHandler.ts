import type { AxiosError } from "axios";

export const errorHandler = (error: AxiosError) => {
  if (error.response) {
    throw new Error(
      `HTTP Error: ${error.response.status} - ${error.response.statusText}. 
      Response data: ${JSON.stringify(error.response.data)}`,
    );
  }
  if (error.request) {
    // No response was received (e.g., network error, timeout)
    throw new Error(
      `Network Error: No response received from server. Request: ${JSON.stringify(error.request)}`,
    );
  }
  // Error occurred in setting up the request
  throw new Error(`Request Setup Error: ${error.message}`);
};
