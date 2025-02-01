import { safeObj } from "~/libs/data.helpers";
import { getTableName } from "drizzle-orm/table";
import { Effect, Option, pipe } from "effect";
import { head, isArray } from "effect/Array";
import { NoSuchElementException } from "effect/Cause";
import { isNullable, isNumber, isRecord, isString } from "effect/Predicate";
import { capitalize } from "effect/String";
import type { DatabaseConnection } from "~/config/database";
import { QueryError } from "~/config/exceptions";
import {
  countWhere,
  queryFiltersToWhere,
  runDrizzleQuery,
} from "~/libs/query.helpers";
import type {
  DrizzleTableWithColumns,
  KeyofTableColumns,
} from "~/services/repository/RepoHelper";
import type {
  FindArg1,
  FindArg2,
  RepoHelperInner,
  RepoModelIdType,
  RepoQueryErrors,
  SearchableParams,
} from "~/services/repository/repo.types";
import type { FilterOrLogicOperator } from "~/services/search/primitives";
import {
  SearchOps,
  SearchPredicate,
} from "~/services/search/sql-search-resolver";

export function createRepoHelpers<TTable extends DrizzleTableWithColumns>(
  table: TTable,
): RepoHelperInner<TTable> {
  if (!table) throw new Error("Error setting up");
  type CreateInterface = typeof table.$inferInsert;
  type SelectInterface = typeof table.$inferSelect;

  type RepoAttributes = {
    columns: KeyofTableColumns<TTable>;
  };

  function resolveIdOrSearchParams<TRepoAttributes extends RepoAttributes>() {
    return function resolveSearchParams(
      searchableColumns: TRepoAttributes["columns"][],
      params: SearchableParams | RepoModelIdType,
    ) {
      if (typeof params === "number" || typeof params === "string") {
        return SearchOps.or(
          ...searchableColumns.map((column) =>
            SearchOps.eq(String(column), params),
          ),
        );
      }

      if (params.constructor.name === "Object") return params.where;

      throw new Error("Invalid `params` provided to resolveSearchParams");
    };
  }

  function toWhere(params: FilterOrLogicOperator | FilterOrLogicOperator[]) {
    return queryFiltersToWhere(table, params);
  }

  function find(
    primaryColumn: RepoAttributes["columns"],
    arg1: FindArg1,
    arg2?: FindArg2,
  ) {
    const isMany = Array.isArray(arg1);

    return pipe(
      runDrizzleQuery((db) => {
        return db
          .select()
          .from(table)
          .where(
            queryFiltersToWhere(
              table,
              resolveWhereQuery(primaryColumn, arg1, arg2),
            ),
          )
          .limit(isMany ? undefined : 1);
      }),
      Effect.andThen((rows) => (isMany ? Option.some(rows) : head(rows))),
      Effect.catchTag("NoSuchElementException", () => {
        return new NoSuchElementException(
          `${capitalize(getTableName(table))} not found`,
        );
      }),
    );
  }

  function firstOrThrow(
    primaryColumn: RepoAttributes["columns"],
    arg1: RepoModelIdType | SearchableParams["where"],
    arg2?: string,
  ) {
    if (Array.isArray(arg1)) {
      return Effect.fail(
        new QueryError(`Model.firstOrThrow() argument mustn't be an Array`),
      );
    }

    return find(primaryColumn, arg1, arg2);
  }

  function deleteModel(
    where: SearchableParams["where"],
  ): Effect.Effect<void, RepoQueryErrors, DatabaseConnection> {
    return pipe(
      runDrizzleQuery((db) => {
        return db.delete(table).where(queryFiltersToWhere(table, where));
      }),
      Effect.flatMap(() => Effect.void),
    );
  }

  function findAll(params: Partial<SearchableParams> = {}) {
    const pageNumber = params?.pageNumber ?? 0;
    const pageSize = params?.pageSize ?? 50;

    return runDrizzleQuery((db) => {
      return db
        .select()
        .from(table)
        .where(queryFiltersToWhere(table, params?.where))
        .limit(pageSize)
        .offset(pageNumber * pageSize);
    });
  }

  function create(
    data: CreateInterface | Array<CreateInterface>,
  ): Effect.Effect<SelectInterface[], RepoQueryErrors, DatabaseConnection> {
    return runDrizzleQuery((client) => {
      return client
        .insert(table)
        .values(Array.isArray(data) ? data : [data])
        .returning();
    });
  }

  function update(
    primaryColumn: RepoAttributes["columns"],
    params: RepoModelIdType | SearchableParams["where"],
    data: unknown,
  ) {
    return runDrizzleQuery((client) => {
      return client
        .update(table)
        .set(safeObj(data))
        .where(
          queryFiltersToWhere(
            table,
            resolveWhereQuery(primaryColumn, params, undefined),
          ),
        )
        .returning();
    });
  }

  function count(where?: SearchableParams["where"]) {
    return countWhere(table, SearchOps.reduce(where));
  }

  const $Infer = {} as {
    Create: CreateInterface;
    Select: SelectInterface;
  };

  return {
    // @ts-expect-error
    // TODO: Remove columnsEq if no longer useful
    columnsEq: resolveIdOrSearchParams<RepoAttributes>(),
    toWhere: toWhere,
    find: find,
    firstOrThrow: firstOrThrow,
    delete: deleteModel,
    all: findAll,
    create: create,
    count,
    update,
    $infer: $Infer,
  } as const;
}

function resolveWhereQuery<Table extends DrizzleTableWithColumns>(
  primaryColumn: KeyofTableColumns<Table>,
  arg1: FindArg1,
  arg2: FindArg2,
): FilterOrLogicOperator[] {
  if (SearchPredicate.isOperation(arg1)) {
    return [arg1];
  }

  if (!isNullable(arg1) && !isNullable(arg2)) {
    return [SearchOps.eq(String(arg1), arg2)];
  }

  if (isString(arg1) || isNumber(arg1)) {
    return [SearchOps.eq(String(primaryColumn), arg1)];
  }

  if (isArray(arg1)) {
    return [SearchOps.in(String(primaryColumn), arg1)];
  }

  if (isRecord(arg1)) {
    return Object.keys(arg1).map((key) => SearchOps.eq(key, arg1[key]));
  }

  return [];
}
