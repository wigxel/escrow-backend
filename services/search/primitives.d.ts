export type Operation =
  | "eq"
  | "neq"
  | "gt"
  | "lt"
  | "gte"
  | "lte"
  | "like"
  | "in"
  | "not"
  | "ilike"
  | "isNull"
  | "notNull";

export interface Filter {
  kind: "FILTER";
  field: string;
  operation: Operation;
  value: unknown;
}

export interface LogicOperator {
  kind: "LOGIC";
  logic: "AND" | "OR";
  filters: FilterOrLogicOperator[];
}

export interface RawOperation {
  kind: "RAW";
  extract: () => unknown;
}

export interface Noop {
  kind: "NONE";
}

export type FilterOrLogicOperator =
  | Filter
  | LogicOperator
  | RawOperation
  | Noop;

export type FilterQuery = {
  readonly search: string;
};

export type PaginationQuery = {
  readonly pageSize: number;
  readonly pageNumber: number;
};
