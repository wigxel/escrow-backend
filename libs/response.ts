import { Match, pipe } from "effect";

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export function resolveErrorResponse(error: any) {
  return pipe(
    Match.value(error),
    Match.tag("ValidationError", (validation_err) => {
      return validation_err.toJSON();
    }),
    Match.orElse((unknown_err) => unknown_err),
  );
}

export function dataResponse(params?: TResponseData) {
  return {
    data: params?.data ? params.data : null,
    status: params?.status ? params.status : "success",
    ...params,
  };
}

type TResponseData = {
  data?: unknown;
  meta?: unknown;
  status?: string;
  message?: string;
};
