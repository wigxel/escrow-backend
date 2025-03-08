import { Effect } from "effect";
import { createSeed } from "~/migrations/seeds/setup";
import { DisputeResolutionssRepoLayer } from "~/repositories/disputeResolution.repo";

export const runSeed = createSeed(
  "DIsputeResolutionSeed",
  Effect.gen(function* (_) {
    const repo = yield* DisputeResolutionssRepoLayer.Tag;

    const categories = [
      { name: "Full refund" },
      { name: "Partial refund" },
      { name: "Replacement" },
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
