import type { Effect, Layer, Runtime } from "effect";

export type InferRequirements<T> = T extends Runtime.Runtime<infer R>
  ? R
  : T extends Layer.Layer<infer ROut, infer E, infer RIn>
    ? ROut
    : T extends Effect.Effect<infer A, infer B, infer C>
      ? C
      : never;

export type InferError<T> = T extends Layer.Layer<
  infer ROut,
  infer E,
  infer RIn
>
  ? E
  : T extends Effect.Effect<infer A, infer B, infer C>
    ? B
    : never;

export type InferScope<T> = T extends Layer.Layer<
  infer ROut,
  infer E,
  infer RIn
>
  ? RIn
  : T extends Effect.Effect<infer A, infer B, infer C>
    ? C
    : never;

export type InferEffectFnResult<T> = T extends (
  ...args: unknown[]
) => Effect.Effect<infer A, infer E, infer R>
  ? A
  : unknown;

export type InferResult<T> = T extends Effect.Effect<infer A, infer E, infer R>
  ? A
  : unknown;
