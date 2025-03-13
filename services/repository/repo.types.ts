import type { Effect } from "effect";
import type { NoSuchElementException, UnknownException } from "effect/Cause";
import type { DatabaseConnection } from "../../config/database";
import type {
  DrizzleTableWithColumns,
  KeyofTableColumns,
} from "../../services/repository/RepoHelper";
import type {
  FilterOrLogicOperator,
  FilterQuery,
  PaginationQuery,
} from "../../services/search/primitives";

export type RepoQueryErrors = UnknownException | Error | NoSuchElementException;

type InferInsert<T extends DrizzleTableWithColumns> = T["$inferInsert"];

type InferSelect<T extends DrizzleTableWithColumns> = T["$inferSelect"];

export interface LegacySearchableRepo<TSearch = unknown> extends Countable {
  searchByQuery: (
    params: Partial<PaginationQuery & FilterQuery>,
  ) => Effect.Effect<TSearch, RepoQueryErrors, DatabaseConnection>;
}

export interface Countable {
  count(
    attributes?: Record<string, unknown>,
  ): Effect.Effect<number, RepoQueryErrors, DatabaseConnection>;
}

export interface SortOrder {
  orderBy?: Record<string, "desc" | "asc">;
}

export interface SearchableParams
  extends PaginationQuery,
    FilterQuery,
    SortOrder {
  where: FilterOrLogicOperator | Array<FilterOrLogicOperator>;
}

export type RepoModelIdType = string | number;

export interface RepoModel {
  count(
    params?: SearchableParams["where"],
  ): Effect.Effect<unknown, unknown, unknown>;

  create: (payload: unknown) => Effect.Effect<unknown, unknown, unknown>;

  /**
   * ```ts
   *  Model.find(1)
   *  Model.find([1,2,4])
   * ```
   */
  find(
    arg1: FindArg1,
    arg2?: FindArg2,
  ): Effect.Effect<unknown, unknown, unknown>;

  /**
   * ```ts
   *  Model.firstOrThrow(1)
   *  Model.findOrThrow({ name: "john" })
   *  Model.findOrThrow(SearchOps.eq('name', 'Johns'))
   * ```
   */
  firstOrThrow(
    arg1: FindArg1,
    arg2?: FindArg2,
  ): Effect.Effect<unknown, unknown, unknown>;

  all: (
    params?: Partial<SearchableParams>,
  ) => Effect.Effect<unknown, unknown, unknown>;

  update(
    params: SearchableParams | RepoModelIdType,
    data: unknown,
  ): Effect.Effect<unknown, unknown, unknown>;

  delete: (
    params: SearchableParams["where"],
  ) => Effect.Effect<unknown, unknown, unknown>;

  with: (name: string) => this;

  paginate(
    filters: Partial<SearchableParams>,
  ): Effect.Effect<unknown, unknown, unknown>;
}

export interface RepoClass<
  Table extends DrizzleTableWithColumns,
  TRelationship extends string,
> {
  new (): RepoHelperOuter<Table, TRelationship>;
}

export interface RepoHelperOuter<
  Table extends DrizzleTableWithColumns,
  TRelationship extends string,
> extends Omit<
    RepoHelperInner<Table, TRelationship>,
    "find" | "firstOrThrow" | "update" | "with"
  > {
  /**
   * ```ts
   *  Model.find(1)
   *  Model.find([1,2,4])
   * ```
   */
  find<Arg1 extends FindArg1>(
    arg1: Arg1,
    arg2?: FindArg2,
  ): Arg1 extends Array<infer U>
    ? Effect.Effect<InferSelect<Table>[], RepoQueryErrors, DatabaseConnection>
    : Effect.Effect<InferSelect<Table>, RepoQueryErrors, DatabaseConnection>;

  /**
   * ```ts
   *  Model.firstOrThrow(1)
   *  Model.findOrThrow({ name: "john" })
   *  Model.findOrThrow(SearchOps.eq('name', 'Johns'))
   * ```
   */
  firstOrThrow(
    arg1: FindArg1,
    arg2?: FindArg2,
  ): ReturnType<RepoHelperInner<Table>["firstOrThrow"]>;

  update(
    params: FindArg1,
    data: unknown,
  ): ReturnType<RepoHelperInner<Table>["update"]>;

  with: (name: TRelationship) => this;
}

export interface RepoHelperInner<
  TTable extends DrizzleTableWithColumns,
  TRelationship extends string = string,
  Insert = InferInsert<TTable>,
  Select = InferInsert<TTable>,
> {
  count: (
    params?: SearchableParams["where"],
  ) => Effect.Effect<number, RepoQueryErrors, DatabaseConnection>;

  create: (
    payload: Insert | Insert[],
  ) => Effect.Effect<
    InferSelect<TTable>[],
    RepoQueryErrors,
    DatabaseConnection
  >;

  all: (
    params?: Partial<SearchableParams>,
  ) => Effect.Effect<Select[], RepoQueryErrors, DatabaseConnection>;

  paginate: (
    params?: Partial<SearchableParams>,
  ) => Effect.Effect<Select[], RepoQueryErrors, DatabaseConnection>;

  /**
   * ```ts
   *  Model.find(1) => Result
   *  Model.find([1,2,4]) => Result[]
   * ```
   */
  find(
    primaryColumn: KeyofTableColumns<TTable>,
    arg1: FindArg1,
    arg2?: FindArg2,
  ): Effect.Effect<
    FindArg1 extends Array<infer U> ? Select[] : Select,
    RepoQueryErrors,
    DatabaseConnection
  >;

  /**
   * ```ts
   *  Model.firstOrThrow(1)
   *  Model.findOrThrow({ name: "john" })
   *  Model.findOrThrow(SearchOps.eq('name', 'Johns'))
   * ```
   */
  firstOrThrow(
    primaryColumn: KeyofTableColumns<TTable>,
    arg1: FindArg1,
    arg2?: FindArg2,
  ): Effect.Effect<Select, RepoQueryErrors, DatabaseConnection>;

  update(
    primaryColumn: KeyofTableColumns<TTable>,
    params: FindArg1,
    data: unknown,
  ): Effect.Effect<Select[], RepoQueryErrors, DatabaseConnection>;

  delete: (
    params: SearchableParams["where"],
  ) => Effect.Effect<void, RepoQueryErrors, DatabaseConnection>;

  with: (key?: TRelationship) => this;
}

export type FindArg1 =
  | RepoModelIdType
  | Array<RepoModelIdType>
  | Record<string, unknown>
  | SearchableParams["where"];

export type FindArg2 = string | number | boolean | never;
