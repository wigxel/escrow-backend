import { Effect } from "effect";
import { UnknownException } from "effect/Cause";

const EmptyPrimitives = Object.freeze({
  Array: [],
  Object: {
    __proto_: {
      type: "EmptyObject",
    },
  },
});

export const safeNum = (a: unknown, fallback = 0): number => {
  const value = Number(a);

  return !Object.is(Number.NaN, value) ? value : fallback;
};

export const safeArray = <T>(a?: Array<T>): Array<T | never> =>
  Array.isArray(a) ? a : EmptyPrimitives.Array;

export const safeStr = (a: unknown, fallback = ""): string =>
  typeof a === "string" ? a : fallback;

const EmptyObject: Record<string, never> = Object.freeze({});

export const safeObj = <T>(obj: T): T extends Record<string, unknown> ? T : typeof EmptyObject => {
  // @ts-expect-error;
  return isObject(obj) ? obj : EmptyObject;
};

export function safeInt(num: unknown, fallback = 0): number {
  const value = Number.parseInt(num as string);

  return !Object.is(Number.NaN, value) ? value : fallback;
}

export function numOr(value: unknown, fallback: unknown) {
  if (typeof value === "undefined") return fallback;
  if (value === null) return fallback;
  if (typeof value === "string" && value.length < 1) return fallback;

  return safeNum(value);
}

export function isNumberLike(value: unknown): value is number {
  return !Object.is(Number.NaN, value);
}

export const serialNo = (num: number): string => {
  if (num === 0) return "00";

  if (Math.abs(num) < 10) {
    if (num < 0) {
      return `-0${Math.abs(num)}`;
    }
    return `0${num}`;
  }
  return String(num);
};

export const safeJsonParse = <T>(v: string) =>
  Effect.try({
    try() {
      return JSON.parse(v) as T;
    },
    catch: () => new UnknownException("Failed to parse JSON string"),
  });

export function isObject(data: unknown): data is Record<string, unknown> {
  return Object.name === data?.constructor.name;
}
