import type { AxiosError } from 'axios';

export const errorHandler = (error: AxiosError): { message: string } => {
  if (error.response) {
    const errorMessage = `HTTP Error: ${error.response.status} - ${error.response.statusText}.
      Response data: ${JSON.stringify(error.response.data)}`;
    return { message: errorMessage };
  }

  if (error.request) {
    const errorMessage = `Network Error: No response received from server. Request: ${JSON.stringify(error.request)}`;
    return { message: errorMessage };
  }

  return { message: `Request Setup Error: ${error.message}` };
};
