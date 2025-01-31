import type { NoSuchElementException, UnknownException } from "effect/Cause";
import { TaggedError } from "effect/Data";
import type { SafeParseError } from "zod";

export class QueryError extends TaggedError("QueryError") {
  constructor(
    public message: string,
    public error?: Error,
  ) {
    super();
  }

  toString() {
    return this.message;
  }
}

export class ValidationError<
  TError extends SafeParseError<unknown> = SafeParseError<unknown>,
> extends TaggedError("ValidationError") {
  data: { message: string; errors: Record<string, string[]> };

  constructor(
    public error: TError,
    comprehensiveMessage?: string,
  ) {
    super();
    const errors = error.error.errors;
    const others_count = errors.length - 1;
    const message = [
      comprehensiveMessage ? `${comprehensiveMessage}.` : undefined,
      errors[0].message,
      others_count > 0 ? `(and ${others_count} more errors)` : undefined,
    ]
      .join(" ")
      .trim();

    this.data = {
      message,
      errors: error.error.flatten((err) => {
        return err.message;
      }).fieldErrors,
    };
  }

  toJSON() {
    return { _tag: "ValidationError", ...this.data };
  }

  toString() {
    return JSON.stringify(this.toJSON(), undefined, 2);
  }
}

/**
 * For edge cases.
 */
export class ExpectedError extends TaggedError("ExpectedError") {
  constructor(public message: string) {
    super();
  }
}

export class PermissionError extends TaggedError("PermissionError") {
  constructor(public message = "Operation not permitted") {
    super();
  }
}

export class InsufficientBalanceException extends TaggedError("InsufficientBalanceException") {
  constructor(public message = "Insufficient account balance") {
    super();
  }
}

export type AppExceptions =
  | PermissionError
  | ValidationError
  | ExpectedError
  | QueryError
  | NoSuchElementException
  | UnknownException;
