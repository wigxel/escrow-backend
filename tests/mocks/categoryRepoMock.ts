import { Effect, Layer } from "effect";
import { CategoryRepo, CategoryRepository } from "~/repositories/category.repo";
import { extendMockImplementation } from "./helpers";

const CategoryLive: CategoryRepository = {
  firstOrThrow(id: string | number) {
    return Effect.succeed({
      id: Number(id),
      name: "First Category",
    });
  },

  /** @ts-expect-error **/
  find(id, arg2?) {
    return Effect.succeed({
      id: Number(id),
      name: "First Category",
    });
  },

  create(data) {
    return Effect.succeed([]);
  },

  update() {
    return Effect.succeed([]);
  },

  delete(cartId) {
    return Effect.succeed([]);
  },

  all: (params) => {
    return Effect.succeed([]);
  },

  count: (params) => {
    return Effect.succeed(1);
  },
};

export const extendCategoryRepo = extendMockImplementation(
  CategoryRepo,
  () => ({
    ...CategoryLive,
  }),
);

export const CategoryRepoTest = Layer.succeed(CategoryRepo, CategoryLive);
