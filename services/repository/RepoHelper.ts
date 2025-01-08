import type { PgTableWithColumns } from "drizzle-orm/pg-core";
import type { Effect } from "effect/Effect";
import { createRepoHelpers } from "~/services/repository/drizzle-repo-helper";
import type {
  FindArg1,
  FindArg2,
  RepoClass,
  RepoHelperInner,
  RepoModelIdType,
  SearchableParams,
} from "~/services/repository/repo.types";

// biome-ignore lint/suspicious/noExplicitAny: Required for inference to work well
export type DrizzleTableWithColumns = PgTableWithColumns<any>;

export type KeyofTableColumns<
  TTable,
  Fallback = unknown,
> = TTable extends PgTableWithColumns<infer Config>
  ? keyof Config["columns"]
  : Fallback;

const DrizzleRepoProto = {
  $helper: {} as RepoHelperInner<DrizzleTableWithColumns>,

  all(params: Partial<SearchableParams>) {
    return this.$helper.all(params);
  },

  count(params?: SearchableParams["where"]) {
    return this.$helper.count(params);
  },

  create(payload: Parameters<typeof this.$helper.create>[0]) {
    return this.$helper.create(payload);
  },

  find(arg1: FindArg1, arg2?: FindArg2) {
    return this.$helper.find(this.primaryColumn, arg1, arg2);
  },

  firstOrThrow(arg1: FindArg1, arg2?: FindArg2) {
    return this.$helper.firstOrThrow(this.primaryColumn, arg1, arg2);
  },

  update(
    arg1: SearchableParams | RepoModelIdType,
    arg2: unknown,
  ): Effect<unknown, unknown, unknown> {
    return this.$helper.update(this.primaryColumn, arg1, arg2);
  },

  delete(params: SearchableParams["where"]) {
    return this.$helper.delete(params);
  },
};

export const DrizzleRepo = <const Table extends DrizzleTableWithColumns>(
  table: Table,
  primaryColumn: KeyofTableColumns<Table>,
): RepoClass<Table> => {
  function DrizzleRepoClass() {}

  DrizzleRepoClass.prototype = {
    primaryColumn,
    ...DrizzleRepoProto,
    $helper: createRepoHelpers(table),
  };

  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  return DrizzleRepoClass as any;
};
