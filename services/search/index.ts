import { Effect, Layer } from "effect";
import type { InferEffectFnResult } from "../../services/effect.util";
import type {
  LegacySearchableRepo,
  RepoHelperOuter,
  SearchableParams,
} from "../../services/repository/repo.types";
import { FilterImpl, SearchFilter } from "../../services/search/filter.service";
import {
  PaginationImpl,
  PaginationService,
} from "../../services/search/pagination.service";
import type {
  FilterQuery,
  PaginationQuery,
} from "../../services/search/primitives";

interface QueryRepo extends LegacySearchableRepo {}

export function searchByQueryRepo<TRepo extends QueryRepo>(repo: TRepo) {
  return searchByRepoWhere(repo, () => ({ where: {} }));
}

export function searchByRepoWhere<TRepo extends QueryRepo, A, E, R>(
  repo: TRepo,
  getWhereParams: (params: Partial<PaginationQuery & FilterQuery>) => {
    where: Record<string, unknown>;
  },
) {
  type ResolvedValue = InferEffectFnResult<TRepo["searchByQuery"]>;

  return Effect.gen(function* (_) {
    const filter = yield* _(SearchFilter);
    const pagination = yield* _(PaginationService);

    yield* Effect.logDebug(
      `searchByQuery:: Search(${filter.search}), Cursor(${pagination.query.pageNumber}), Limit(${pagination.query.pageSize})`,
    );

    const searchParams = {
      search: filter.search,
      ...pagination.query,
    };

    const where = {
      ...getWhereParams(searchParams),
      ...searchParams,
    };

    const [total, data] = yield* _(
      Effect.all([repo.count(where), repo.searchByQuery(where)]),
    );

    return {
      data: data as ResolvedValue,
      meta: {
        ...pagination.meta,
        total,
      },
    };
  });
}

export function searchRepo<
  // biome-ignore lint/suspicious/noExplicitAny: Type is inferred from the repo
  const TRepo extends RepoHelperOuter<any, any>,
  const TData = InferEffectFnResult<TRepo["paginate"]>,
>(
  repo: TRepo,
  getWhereParams: (params: Partial<PaginationQuery & FilterQuery>) => {
    where: SearchableParams["where"];
    orderBy?: SearchableParams["orderBy"];
    // @ts-expect-error No need to specify type
  } = () => ({}),
) {
  return Effect.suspend(() => {
    return Effect.gen(function* (_) {
      const filter = yield* _(SearchFilter);
      const pagination = yield* _(PaginationService);

      yield* Effect.logDebug(
        `searchByQuery:: Search(${filter.search}), Cursor(${pagination.query.pageNumber}), Limit(${pagination.query.pageSize})`,
      );

      const searchParams = {
        search: filter.search,
        ...pagination.query,
      };

      const filters: SearchableParams = {
        ...getWhereParams(searchParams),
        ...searchParams,
      };

      const [total, data] = yield* _(
        Effect.all([repo.count(filters.where), repo.paginate(filters)]),
      );

      return {
        data: data as TData,
        meta: {
          ...pagination.meta,
          total,
        },
      };
    });
  });
}

export function SearchServiceLive(query: Record<string, unknown>) {
  return Layer.merge(PaginationImpl(query), FilterImpl(query));
}
