import { faker } from "@faker-js/faker";
import chalk from "chalk";
import { Console, type Context, Effect } from "effect";
import * as Arr from "effect/Array";
import { head } from "effect/Array";
import { TaggedError } from "effect/Data";
import type { InferReturnEffect } from "../../context/effect_utils";

// ---- SEEDER ------
export function createSeed<A, E, R>(
  label: `${string}Seed`,
  effect: Effect.Effect<A, E, R>,
) {
  return Console.info(`Seeding ${label}...`).pipe(
    Effect.flatMap(() => Effect.suspend(() => effect)),
    Effect.mapError((e) => new SeedError(String(e), label)),
  );
}

export class SeedError extends TaggedError("SeedError") {
  constructor(
    public message: string,
    public label: string,
  ) {
    super();
  }

  toString() {
    return [
      `${chalk.red(`[${this.label}]`)} Seeding failed`,
      `${chalk.gray(`Reason: ${this.message}`)}`,
    ].join("\n");
  }
}

export const logErrors = Effect.tapError((error) => Console.error(error));
// ---- END SEEDER ------

// ---- FACTORY ------
export const SeederFactoriesMap = new Map();

// biome-ignore lint/suspicious/noExplicitAny: Must be any to ensure it works
export function createFactory<TContext extends Context.Tag<any, any>, B, E, R>(
  context: TContext,
  fn: ($faker: typeof faker) => Effect.Effect<Partial<B>, E, R>,
) {
  const label = `${context.key}Factory`;
  SeederFactoriesMap.set(
    label,
    Effect.suspend(() => fn(faker)),
  );
  return factory<B, E, R, TContext>({
    key: label,
    context: context,
  });
}

export function factory<
  A,
  E,
  R,
  // biome-ignore lint/suspicious/noExplicitAny: Must be any to ensure it works
  TContext extends Context.Tag<any, any>,
>(params: {
  key: string;
  context: TContext;
  count?: number;
}): FactoryMethods<A, E, R, TContext> {
  type TLocalFactory = FactoryMethods<A, E, R, TContext>;

  const { key, context, count = 1 } = params;

  const make: TLocalFactory["make"] = (data) => {
    return Effect.gen(function* () {
      const effect: Effect.Effect<Partial<A>, E, R> = SeederFactoriesMap.get(
        key,
      );

      if (!Effect.isEffect(effect)) {
        yield* new SeedError(`Factory ${key} not present`, "Seeder.factory");
      }

      const random_data = yield* effect;

      return Object.assign(random_data, data) as A;
    });
  };

  const adjustCount: TLocalFactory["count"] = (integer: number) => {
    return factory({ count: integer, ...params });
  };

  // @ts-expect-error
  const create: TLocalFactory["create"] = (other_data) => {
    return Effect.gen(function* (_) {
      const instance = yield* context;

      const makeThenCreate = Effect.suspend(() => {
        return make(other_data).pipe(
          Effect.flatMap((final) => instance.create(final)),
          Effect.flatMap((e) =>
            Array.isArray(e) ? head(e) : Effect.succeed(e),
          ),
          Effect.mapError(
            (err) => new SeedError(`key: ${String(err)}`, "Seeder.create"),
          ),
        );
      });

      if (count > 1) {
        return yield* _(
          Array.from({ length: count }),
          Arr.map(() => makeThenCreate),
          Effect.all,
        );
      }

      return yield* makeThenCreate;
    });
  };

  return {
    count: adjustCount,
    create,
    make,
  };
}

type ModelFields<A> = A extends Iterable<infer I> ? Partial<I> : Partial<A>;

interface FactoryRepoMethods {
  create: (...a: unknown[]) => Effect.Effect<unknown, unknown, unknown>;
}

export interface FactoryMethods<
  A,
  E,
  R,
  TRepoModel extends Context.Tag<unknown, FactoryRepoMethods>,
> {
  /**
   * Generates factory data and attempts to write to the database
   * @param data
   */
  create(
    data: ModelFields<A>,
  ): ResolveFactoryCreateResult<
    InferReturnEffect<Context.Tag.Service<TRepoModel>["create"]>,
    Effect.Effect<A, E, R>
  >;

  /**
   * Only generates the factory data
   * @param data
   */
  make(data: ModelFields<A>): Effect.Effect<A, E | SeedError, R>;

  count(integer: number): FactoryMethods<Array<A>, E, R, TRepoModel>;
}
// ---- END FACTORY ------

type ResolveFactoryCreateResult<ActualResult, Effect> =
  Effect extends Effect.Effect<infer Result, infer E, infer R>
    ? Result extends Array<infer U>
      ? Effect.Effect<U[], E, R>
      : ActualResult extends Array<infer F>
        ? Effect.Effect<F, E, R>
        : Effect.Effect<ActualResult, E, R>
    : Effect;
