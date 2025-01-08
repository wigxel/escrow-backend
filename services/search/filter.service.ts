import { Context, Layer } from "effect";
import { isEmpty } from "effect/String";

export class SearchFilter extends Context.Tag("SearchFilter")<
  SearchFilter,
  { search: string }
>() {}

export const FilterImpl = (query?: Record<string, unknown>) => {
  const search_str = (query?.search as string) ?? "";

  return Layer.succeed(SearchFilter, {
    search: isEmpty(search_str) ? "" : search_str,
  });
};
