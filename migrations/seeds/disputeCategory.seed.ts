import { Effect } from "effect";
import { createSeed } from "~/migrations/seeds/setup";
import { DisputeCategorysRepoLayer } from "~/repositories/disputeCategories.repo";

export const runSeed = createSeed(
  "DIsputeCategorySeed",
  Effect.gen(function* (_) {
    const repo = yield* DisputeCategorysRepoLayer.Tag;

    const categories = [
      { name: "Item not received" },
      { name: "Item different from description" },
      { name: "Item damaged/defective" },
      { name: "Partial delivery" },
      { name: "Others" },
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
