import { safeInt } from "../../libs/data.helpers";
import { Context, Layer, Order } from "effect";
import { FilterImpl } from "../../services/search/filter.service";
import type { PaginationQuery } from "../../services/search/primitives";

export const DEFAULT_PAGINATION_LIMIT = 25;

export function Pagination(
  data?: { limit: number; page: number } | Record<string, unknown>,
) {
  const clamp = Order.clamp(Order.number);

  const pageSize = clamp(safeInt(data?.limit), {
    minimum: 5,
    maximum: 100,
  });

  const page_count = clamp(safeInt(data?.page, 0), {
    minimum: 1,
    maximum: Number.POSITIVE_INFINITY,
  });

  return {
    get query(): PaginationQuery {
      return {
        pageSize,
        pageNumber: page_count - 1,
      };
    },
    get meta() {
      return {
        current_page: page_count,
        per_page: pageSize,
      };
    },
  };
}

export class PaginationService extends Context.Tag("PaginationService")<
  PaginationService,
  ReturnType<typeof Pagination>
>() {}

export const PaginationImpl = (query?: Record<string, unknown>) =>
  Layer.succeed(PaginationService, Pagination(query));

export function SearchServiceLive(query: Record<string, unknown>) {
  return Layer.merge(PaginationImpl(query), FilterImpl(query));
}
