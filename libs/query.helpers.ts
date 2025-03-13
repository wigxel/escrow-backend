import { safeObj } from "../libs/data.helpers";
import {
  type SQLWrapper,
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  gte,
  ilike,
  inArray,
  isNotNull,
  isNull,
  like,
  lt,
  lte,
  not,
  notInArray,
  or,
} from "drizzle-orm";
import type { PgTableWithColumns, TableConfig } from "drizzle-orm/pg-core";
import { getTableName } from "drizzle-orm/table";
import { Effect, Option, pipe } from "effect";
import { head } from "effect/Array";
import { NoSuchElementException, UnknownException } from "effect/Cause";
import { isNullable } from "effect/Predicate";
import { is } from "ramda";
import { DatabaseConnection, type DrizzlePgDatabase } from "../config/database";
import { QueryError } from "../config/exceptions";
import type { SearchableParams } from "../services/repository/repo.types";
import type { DrizzleTableWithColumns } from "../services/repository/RepoHelper";
import { PaginationService } from "../services/search/pagination.service";
import type {
  FilterOrLogicOperator,
  PaginationQuery,
} from "../services/search/primitives";
import { buildWhereQueryFilterResolver } from "../services/search/sql-search-resolver";

export const resolveQueryError = (err: unknown) => {
  if (typeof err === "string") return new Error(err);
  if (err instanceof Error) return err;

  if (is(Object, err) && "message" in err) {
    return new Error(err.message);
  }

  return new Error("Unknown error");
};

export function tryQuery<TValue>(fn: (a: unknown) => Promise<TValue>) {
  return Effect.tryPromise<TValue, UnknownException | QueryError>({
    try: fn,
    catch(err) {
      const error = resolveQueryError(err);

      if (error.message.includes("Can't reach database server"))
        return new QueryError("Can't establish connection with database");

      return new UnknownException(error, error.message);
    },
  });
}

export const notNil = <T>(e: T) =>
  isNullable(e)
    ? Effect.fail(new NoSuchElementException("Record not found"))
    : Effect.succeed(e);

export function noResultMessage(message: string) {
  return <T>(e: T) =>
    isNullable(e)
      ? Effect.fail(new QueryError(message))
      : Effect.succeed(e as Exclude<T, undefined | null>);
}

export function tryQueryOption<TValue>(fn: (a: unknown) => Promise<TValue>) {
  return tryQuery(fn).pipe(Effect.flatMap(Option.fromNullable));
}

export const extractCount = <const A extends { count: number }[], E, R>(
  effect: Effect.Effect<A, E, R>,
): Effect.Effect<number, E | NoSuchElementException, R> => {
  return effect.pipe(
    Effect.flatMap(head),
    Effect.map((e) => e.count),
  );
};

export function queryEqualMap<T extends TableConfig>(
  model: PgTableWithColumns<T>,
  where?: Record<string, unknown>,
) {
  const pairs = Object.entries(safeObj(where))
    .filter(([column]) => model[column])
    .map(([column, compareValue]) => {
      return eq(model[column], compareValue);
    });

  if (pairs.length < 1) return undefined;
  if (pairs.length === 1) return pairs[0] ?? undefined;
  return and(...pairs);
}

export function runDrizzleQuery<T>(fn: (a: DrizzlePgDatabase) => Promise<T>) {
  return DatabaseConnection.pipe(
    Effect.flatMap((db) => tryQuery(() => fn(db))),
    Effect.map((a) => a as T),
  );
}

export function runDrizzleQueryDebug<T>(
  fn: (a: DrizzlePgDatabase) => Promise<T>,
) {
  return DatabaseConnection.pipe(
    Effect.flatMap((db) => {
      return pipe(
        Effect.try(() => fn(db)),
        // @ts-expect-error
        Effect.tap((query) => Effect.logDebug("Query/SQL", query.toSQL())),
        Effect.flatMap((e) => runDrizzleQuery(() => e)),
      );
    }),
  );
}

export function countWhere<T extends TableConfig>(
  table: PgTableWithColumns<T>,
  where?: SearchableParams["where"],
) {
  const query = runDrizzleQuery((db) => {
    return db
      .select({ count: count() })
      .from(table)
      .where(queryFiltersToWhere(table, where));
  });

  return pipe(
    query,
    extractCount,
    Effect.tap((count) => {
      const whereParams = JSON.stringify(where);

      return Effect.logDebug(
        `Query/Count: Found(${count}) where(${whereParams})`,
      );
    }),
  );
}

export function queryFiltersToWhere<T extends TableConfig>(
  model: PgTableWithColumns<T>,
  filters: FilterOrLogicOperator | FilterOrLogicOperator[],
) {
  const _filters = Array.isArray(filters) ? filters : [filters];
  if (!_filters.length) return undefined;

  const transformFilters = buildWhereQueryFilterResolver(
    {
      getField: (fieldName) => {
        if (!(fieldName in model)) {
          console.warn(
            `[QueryFilters/Error] ${fieldName} not a property in ${getTableName(model)}`,
          );
          console.warn(
            "[QueryFilters/Error] Use drizzle property name instead of Database column name.",
          );
        }

        return model[fieldName];
      },
      empty: () => undefined,
      // expects SQL Wrapper as the raw filter
      transformRawFilter: (filter) => filter.extract() as SQLWrapper,
    },
    {
      eq: (field, value) => eq(field, value),
      neq: (field, value) => not(eq(field, value)),
      gt: (field, value) => gt(field, value),
      lt: (field, value) => lt(field, value),
      gte: (field, value) => gte(field, value),
      lte: (field, value) => lte(field, value),
      like: (field, value) => {
        if (typeof value !== "string") return undefined;
        return like(field, value);
      },
      ilike: (field, value) => {
        if (typeof value !== "string") return undefined;
        return ilike(field, value);
      },
      notNull: (field) => isNotNull(field),
      isNull: (field) => isNull(field),
      in: (field, value) => inArray(field, value),
      notIn: (field, value) => notInArray(field, value),
      or: (fields) => or(...fields),
      and: (fields) => and(...fields),
    },
  );

  return and(...transformFilters(_filters));
}

export function paginateQuery<A extends Readonly<[number, unknown[]]>, E, R>(
  fn: (query: PaginationQuery) => Effect.Effect<A, E, R>,
) {
  return Effect.gen(function* (_) {
    const pagination = yield* PaginationService;
    const [total, data] = yield* fn(pagination.query);

    return {
      data: data,
      meta: {
        ...pagination.meta,
        total: total,
      },
    };
  });
}

export const allColumns = (v: DrizzleTableWithColumns) =>
  Object.fromEntries(Object.keys(v).map((key) => [key, v[key]]));

/**
 * Works only for drizzle
 * @example db.query.<model>.findMany({
 *     orderBy: toSortOrder({ created_at: 'desc', name: 'asc' })
 *   })
 * @param sort_column_map
 * @returns
 */
export function toSortOrder(sort_column_map: SearchableParams["orderBy"]) {
  return (fields: Record<string, unknown>) => {
    const order_records = [];

    for (const key in sort_column_map) {
      const drizzle_column = fields[key];
      const dir = sort_column_map[key];

      if (!drizzle_column) continue;

      // @ts-expect-error
      order_records.push(
        dir === "desc" ? desc(drizzle_column) : asc(drizzle_column),
      );
    }

    return order_records;
  };
}
