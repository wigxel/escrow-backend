import { Effect } from "effect";
import { createSeed } from "~/migrations/seeds/setup";
import { CategoryRepo } from "~/repositories/category.repo";

export const runSeed = createSeed(
  "CategorySeed",
  Effect.gen(function* (_) {
    const repo = yield* CategoryRepo;

    const categories = [
      { id: 1, name: "Gadgets" },
      { id: 2, name: "Furnitures" },
      { id: 3, name: "Phones" },
      { id: 4, name: "Electronics" },
      { id: 5, name: "Clothes" },
    ];

    return yield* Effect.all(
      categories.map((category) => {
        return repo.find("name", category.name).pipe(
          Effect.matchEffect({
            onFailure: () => repo.create(category),
            onSuccess: (v) => Effect.succeed(v),
          }),
        );
      }),
    );
  }),
);
